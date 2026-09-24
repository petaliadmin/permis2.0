'use client';

import { create } from 'zustand';
import type { SubscriptionPlan, Subscription } from '@permis2.0/types';
import { useAuthStore } from './authStore';
import { fetchWithCache, peekCache, userScopedKey } from '@/lib/offlineCache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SubscriptionState {
  /** The subscription plan catalog (élève / auto-école / top auto-école). */
  products: SubscriptionPlan[];
  entitlementKeys: string[];
  /** ISO expiry of the STUDENT subscription, or null if none. */
  premiumExpiresAt: string | null;
  /** The current user's own subscription requests/grants, most recent first. */
  purchases: Subscription[];
  loading: boolean;
  /** True once fetchEntitlements() has completed at least once (even for guests). */
  entitlementsReady: boolean;

  // Selectors
  hasKey: (key: string) => boolean;

  // Actions
  fetchProducts: () => Promise<void>;
  fetchEntitlements: () => Promise<void>;
  fetchPurchases: () => Promise<void>;
  /** schoolId is required for school-scoped plans (SCHOOL, SCHOOL_FEATURED).
   *  method defaults server-side to WHATSAPP; pass 'WAVE' for the Wave flow. */
  requestManual: (planId: string, schoolId?: string, method?: 'WHATSAPP' | 'WAVE') => Promise<void>;
}

/**
 * Subscription state. Plans are public; entitlements/subscriptions
 * authenticate via httpOnly cookie (credentials: 'include'). Payment is
 * manual (WhatsApp) only for now — requestManual records a PENDING row for
 * the admin to confirm, then fetchEntitlements() is re-called once the team
 * activates it so premium content unlocks without a re-login.
 */
/** Cache is scoped to the signed-in user; if there's nobody it hydrates as a guest. */
const cachedProducts = peekCache<SubscriptionPlan[]>(userScopedKey('products'));
const cachedEntitlements = peekCache<{ keys: string[]; premiumExpiresAt: string | null }>(
  userScopedKey('entitlements')
);
const cachedPurchases = peekCache<Subscription[]>(userScopedKey('purchases'));

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  // Seeded from the last successful fetch so premium access and the catalog
  // are available instantly — including offline — before revalidation lands.
  products: cachedProducts?.data ?? [],
  entitlementKeys: cachedEntitlements?.data.keys ?? [],
  premiumExpiresAt: cachedEntitlements?.data.premiumExpiresAt ?? null,
  purchases: cachedPurchases?.data ?? [],
  loading: false,
  entitlementsReady: false,

  hasKey: (key) => {
    const keys = get().entitlementKeys;
    return keys.includes('premium_all') || keys.includes(key);
  },

  fetchProducts: async () => {
    set({ loading: true });
    try {
      const { data } = await fetchWithCache<SubscriptionPlan[]>(
        userScopedKey('products'),
        `${API_URL}/subscriptions/plans`,
        { credentials: 'include' }
      );
      set({ products: data });
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
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
      const { data } = await fetchWithCache<{ keys: string[]; premiumExpiresAt: string | null }>(
        userScopedKey('entitlements'),
        `${API_URL}/subscriptions/entitlements`,
        { credentials: 'include' }
      );
      set({
        entitlementKeys: data.keys ?? [],
        premiumExpiresAt: data.premiumExpiresAt ?? null,
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
      const { data } = await fetchWithCache<Subscription[]>(
        userScopedKey('purchases'),
        `${API_URL}/subscriptions/mine`,
        { credentials: 'include' }
      );
      set({ purchases: data });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  },

  /**
   * Manual mode (WhatsApp or Wave): records a PENDING subscription so the
   * request shows up in the admin's "Demandes" list. Best-effort — never
   * blocks or fails the WhatsApp/Wave redirect the user is about to make.
   */
  requestManual: async (planId, schoolId, method) => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      await fetch(`${API_URL}/subscriptions/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId, schoolId, method }),
      });
    } catch {
      /* the WhatsApp conversation is still the source of truth — ignore */
    }
  },
}));
