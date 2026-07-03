'use client';

import { create } from 'zustand';
import type { Product, Purchase, PaymentMethod } from '@permis2.0/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function authToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('auth-store') || '{}').state?.token ?? null;
  } catch {
    return null;
  }
}

type CheckoutStatus = 'idle' | 'pending' | 'paid' | 'failed';

interface PurchasesState {
  products: Product[];
  entitlementKeys: string[];
  /** ISO expiry of the premium_all subscription, or null if none/permanent. */
  premiumExpiresAt: string | null;
  purchases: Purchase[];
  loading: boolean;
  checkoutStatus: CheckoutStatus;
  activePurchaseId: string | null;
  error: string | null;

  // Selectors
  hasKey: (key: string) => boolean;
  isOwnedProduct: (sku: string) => boolean;

  // Actions
  fetchProducts: () => Promise<void>;
  fetchEntitlements: () => Promise<void>;
  fetchPurchases: () => Promise<void>;
  checkout: (
    productId: string,
    phone: string,
    method: PaymentMethod,
  ) => Promise<{ purchaseId: string; redirectUrl?: string } | null>;
  pollPurchase: (purchaseId: string) => Promise<void>;
  simulateConfirm: (purchaseId: string) => Promise<void>;
  resetCheckout: () => void;
}

/**
 * Boutique state (Sprint 6). Products are public; entitlements/purchases need a
 * token (read from the persisted auth-store, same convention as examStore). After
 * a checkout we poll the purchase until PAID/FAILED, then refetch entitlements so
 * 🔒 content unlocks immediately.
 */
export const usePurchasesStore = create<PurchasesState>((set, get) => ({
  products: [],
  entitlementKeys: [],
  premiumExpiresAt: null,
  purchases: [],
  loading: false,
  checkoutStatus: 'idle',
  activePurchaseId: null,
  error: null,

  hasKey: (key) => {
    const keys = get().entitlementKeys;
    return keys.includes('premium_all') || keys.includes(key);
  },
  isOwnedProduct: (sku) => {
    const product = get().products.find((p) => p.sku === sku);
    return !!product?.owned;
  },

  fetchProducts: async () => {
    set({ loading: true });
    try {
      const token = authToken();
      const res = await fetch(`${API_URL}/shop/products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      set({ products: await res.json() });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchEntitlements: async () => {
    const token = authToken();
    if (!token) {
      set({ entitlementKeys: [], premiumExpiresAt: null });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/shop/entitlements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch entitlements');
      const data = await res.json();
      // Surface the subscription's expiry (premium_all) for the boutique's
      // "active until …" state. The API omits already-expired entitlements.
      const premium = (data.rows ?? []).find(
        (r: { key: string; expiresAt: string | null }) =>
          r.key === 'premium_all',
      );
      set({
        entitlementKeys: data.keys ?? [],
        premiumExpiresAt: premium?.expiresAt ?? null,
      });
    } catch (error) {
      console.error('Error fetching entitlements:', error);
    }
  },

  fetchPurchases: async () => {
    const token = authToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/shop/purchases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch purchases');
      set({ purchases: await res.json() });
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  },

  checkout: async (productId, phone, method) => {
    const token = authToken();
    if (!token) {
      set({ checkoutStatus: 'failed', error: 'Connectez-vous pour acheter.' });
      return null;
    }
    set({ checkoutStatus: 'pending', error: null });
    try {
      // Separate the network error (TypeError: Failed to fetch) from HTTP errors
      let res: Response;
      try {
        res = await fetch(`${API_URL}/shop/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId, phone, method }),
        });
      } catch {
        throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion.');
      }

      if (!res.ok) {
        // Extract the actual NestJS error body instead of discarding it
        let serverMsg = `Erreur serveur (${res.status})`;
        try {
          const body = await res.json();
          if (res.status === 401) {
            serverMsg = 'Session expirée. Reconnectez-vous.';
          } else if (res.status === 404) {
            serverMsg = 'Produit introuvable. Rechargez la boutique.';
          } else {
            const m = body.message;
            serverMsg = Array.isArray(m)
              ? m[0]
              : typeof m === 'string'
                ? m
                : (body.error ?? serverMsg);
          }
        } catch { /* keep default */ }
        throw new Error(serverMsg);
      }

      const data = await res.json();
      set({ activePurchaseId: data.purchaseId });
      // Remember the purchase so the boutique can resume polling after a
      // redirect flow (card / hosted checkout) returns the user.
      if (typeof window !== 'undefined') {
        localStorage.setItem('pending-purchase', data.purchaseId);
      }
      return { purchaseId: data.purchaseId, redirectUrl: data.redirectUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Le paiement a échoué.';
      set({ checkoutStatus: 'failed', error: message });
      return null;
    }
  },

  /**
   * Poll the purchase until it resolves to PAID or FAILED (mobile-money confirms
   * on the phone; card returns via redirect). On PAID we refetch entitlements so
   * premium content unlocks immediately. Gives up after ~90s.
   */
  pollPurchase: async (purchaseId) => {
    const token = authToken();
    if (!token) return;
    set({ activePurchaseId: purchaseId, checkoutStatus: 'pending', error: null });
    const deadline = Date.now() + 90_000;

    const poll = async (): Promise<void> => {
      try {
        const res = await fetch(`${API_URL}/shop/purchases/${purchaseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const purchase = await res.json();
          if (purchase.status === 'PAID') {
            set({ checkoutStatus: 'paid' });
            await get().fetchEntitlements();
            if (typeof window !== 'undefined') localStorage.removeItem('pending-purchase');
            return;
          }
          if (purchase.status === 'FAILED') {
            set({ checkoutStatus: 'failed', error: 'Le paiement a échoué ou a été annulé.' });
            if (typeof window !== 'undefined') localStorage.removeItem('pending-purchase');
            return;
          }
        }
      } catch {
        /* transient network error — keep retrying until the deadline */
      }
      if (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 3000));
        return poll();
      }
      set({ checkoutStatus: 'failed', error: 'Délai dépassé. Vérifiez votre paiement.' });
    };

    await poll();
  },

  /** Dev-only helper: force the sandbox to confirm a pending purchase. */
  simulateConfirm: async (purchaseId) => {
    const token = authToken();
    if (!token) return;
    try {
      await fetch(`${API_URL}/shop/purchases/${purchaseId}/simulate-confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* ignore — polling below surfaces the final state */
    }
    await get().pollPurchase(purchaseId);
  },

  resetCheckout: () =>
    set({ checkoutStatus: 'idle', activePurchaseId: null, error: null }),
}));
