'use client';

import { create } from 'zustand';
import type { Product, Purchase, PaymentMethod } from '@permis2.0/types';
import { useAuthStore } from './authStore';
import { fetchWithCache, peekCache, userScopedKey } from '@/lib/offlineCache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type CheckoutStatus = 'idle' | 'pending' | 'paid' | 'failed';

interface PurchasesState {
  products: Product[];
  entitlementKeys: string[];
  /** ISO expiry of the premium_all subscription, or null if none/permanent. */
  premiumExpiresAt: string | null;
  purchases: Purchase[];
  loading: boolean;
  /** True once fetchEntitlements() has completed at least once (even for guests). */
  entitlementsReady: boolean;
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
    phone?: string,
    method?: PaymentMethod
  ) => Promise<{ purchaseId: string; redirectUrl?: string; ussdMessage?: string } | null>;
  requestManual: (productId: string) => Promise<void>;
  pollPurchase: (purchaseId: string) => Promise<void>;
  simulateConfirm: (purchaseId: string) => Promise<void>;
  resetCheckout: () => void;
}

/**
 * Boutique state. Products are public; entitlements/purchases authenticate via
 * httpOnly cookie (credentials: 'include'). After checkout we poll until
 * PAID/FAILED, then refetch entitlements so premium content unlocks immediately.
 */
/** Cache is scoped to the signed-in user; if there's nobody it hydrates as a guest. */
const cachedProducts = peekCache<Product[]>(userScopedKey('products'));
const cachedEntitlements = peekCache<{
  keys: string[];
  rows: { key: string; expiresAt: string | null }[];
}>(userScopedKey('entitlements'));
const cachedPurchases = peekCache<Purchase[]>(userScopedKey('purchases'));
const cachedPremium = cachedEntitlements?.data.rows?.find((r) => r.key === 'premium_all');

export const usePurchasesStore = create<PurchasesState>((set, get) => ({
  // Seeded from the last successful fetch so premium access and the catalog
  // are available instantly — including offline — before revalidation lands.
  products: cachedProducts?.data ?? [],
  entitlementKeys: cachedEntitlements?.data.keys ?? [],
  premiumExpiresAt: cachedPremium?.expiresAt ?? null,
  purchases: cachedPurchases?.data ?? [],
  loading: false,
  entitlementsReady: false,
  checkoutStatus: 'idle',
  activePurchaseId: null,
  error: null,
  // internal flag — prevents concurrent polling loops for the same purchase
  _pollingId: null as string | null,

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
      const { data } = await fetchWithCache<Product[]>(
        userScopedKey('products'),
        `${API_URL}/shop/products`,
        { credentials: 'include' }
      );
      set({ products: data });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchEntitlements: async () => {
    if (!useAuthStore.getState().isAuthenticated) {
      set({ entitlementKeys: [], premiumExpiresAt: null, entitlementsReady: true });
      return;
    }
    try {
      const { data } = await fetchWithCache<{
        keys: string[];
        rows: { key: string; expiresAt: string | null }[];
      }>(userScopedKey('entitlements'), `${API_URL}/shop/entitlements`, {
        credentials: 'include',
      });
      const premium = (data.rows ?? []).find((r) => r.key === 'premium_all');
      set({
        entitlementKeys: data.keys ?? [],
        premiumExpiresAt: premium?.expiresAt ?? null,
        entitlementsReady: true,
      });
    } catch (error) {
      console.error('Error fetching entitlements:', error);
      set({ entitlementsReady: true }); // on error, unblock pages (treats as guest)
    }
  },

  fetchPurchases: async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      const { data } = await fetchWithCache<Purchase[]>(
        userScopedKey('purchases'),
        `${API_URL}/shop/purchases`,
        { credentials: 'include' }
      );
      set({ purchases: data });
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  },

  checkout: async (productId, phone?, method?) => {
    if (!useAuthStore.getState().isAuthenticated) {
      set({ checkoutStatus: 'failed', error: 'Connectez-vous pour acheter.' });
      return null;
    }
    set({ checkoutStatus: 'pending', error: null });
    try {
      let res: Response;
      try {
        res = await fetch(`${API_URL}/shop/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ productId, phone, method }),
        });
      } catch {
        throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion.');
      }

      if (!res.ok) {
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
        } catch {
          /* keep default */
        }
        throw new Error(serverMsg);
      }

      const data = await res.json();
      set({ activePurchaseId: data.purchaseId });
      if (typeof window !== 'undefined') {
        localStorage.setItem('pending-purchase', data.purchaseId);
      }
      return {
        purchaseId: data.purchaseId,
        redirectUrl: data.redirectUrl,
        ussdMessage: data.ussdMessage,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Le paiement a échoué.';
      set({ checkoutStatus: 'failed', error: message });
      return null;
    }
  },

  /**
   * Manual (WhatsApp) mode: records a PENDING purchase so the request shows
   * up in the admin's "Demandes" list. Best-effort — never blocks or fails
   * the WhatsApp redirect the user is about to make.
   */
  requestManual: async (productId) => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      await fetch(`${API_URL}/shop/request-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId }),
      });
    } catch {
      /* the WhatsApp conversation is still the source of truth — ignore */
    }
  },

  /**
   * Poll the purchase until PAID or FAILED. On PAID refetch entitlements so
   * premium content unlocks immediately. Gives up after ~90s.
   */
  pollPurchase: async (purchaseId) => {
    if (!useAuthStore.getState().isAuthenticated) return;
    // Prevent concurrent loops for the same purchase
    if ((get() as any)._pollingId === purchaseId) return;
    (get() as any)._pollingId = purchaseId;

    set({ activePurchaseId: purchaseId, checkoutStatus: 'pending', error: null });
    const deadline = Date.now() + 90_000;

    const poll = async (): Promise<void> => {
      // Another caller reset the store — stop this loop
      if ((get() as any)._pollingId !== purchaseId) return;
      try {
        const res = await fetch(`${API_URL}/shop/purchases/${purchaseId}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const purchase = await res.json();
          if (purchase.status === 'PAID') {
            (get() as any)._pollingId = null;
            set({ checkoutStatus: 'paid' });
            await get().fetchEntitlements();
            if (typeof window !== 'undefined') localStorage.removeItem('pending-purchase');
            return;
          }
          if (purchase.status === 'FAILED') {
            (get() as any)._pollingId = null;
            set({ checkoutStatus: 'failed', error: 'Le paiement a échoué ou a été annulé.' });
            if (typeof window !== 'undefined') localStorage.removeItem('pending-purchase');
            return;
          }
        }
      } catch {
        /* transient network error — keep retrying until deadline */
      }
      if (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 3000));
        return poll();
      }
      (get() as any)._pollingId = null;
      set({ checkoutStatus: 'failed', error: 'Délai dépassé. Vérifiez votre paiement.' });
    };

    await poll();
  },

  /** Dev-only helper: force the sandbox to confirm a pending purchase. */
  simulateConfirm: async (purchaseId) => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      await fetch(`${API_URL}/shop/purchases/${purchaseId}/simulate-confirm`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      /* ignore — polling below surfaces the final state */
    }
    await get().pollPurchase(purchaseId);
  },

  resetCheckout: () => {
    (get() as any)._pollingId = null;
    set({ checkoutStatus: 'idle', activePurchaseId: null, error: null });
  },
}));
