'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePurchasesStore } from '@/store/purchasesStore';
import { flushSyncQueue } from '@/lib/syncQueue';

const FOCUS_REFETCH_THROTTLE_MS = 10_000;

/**
 * Fetches entitlements on mount and whenever auth state changes. Also refetches
 * when the app regains focus (throttled): with the manual WhatsApp activation
 * flow, the team grants the subscription while the user is in WhatsApp — on
 * return, access must be live without re-login.
 *
 * Also the app's single "back online" hook: delivers anything queued by
 * lib/syncQueue while offline (e.g. a quiz result) and revalidates the
 * cached catalog/entitlements/purchases so premium access reflects reality
 * again as soon as connectivity returns, not just on the next focus/reload.
 */
export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchEntitlements = usePurchasesStore((s) => s.fetchEntitlements);
  const fetchProducts = usePurchasesStore((s) => s.fetchProducts);
  const fetchPurchases = usePurchasesStore((s) => s.fetchPurchases);
  const lastFetch = useRef(0);

  useEffect(() => {
    lastFetch.current = Date.now();
    fetchEntitlements();
  }, [isAuthenticated, fetchEntitlements]);

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastFetch.current < FOCUS_REFETCH_THROTTLE_MS) return;
      lastFetch.current = Date.now();
      fetchEntitlements();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [fetchEntitlements]);

  useEffect(() => {
    // A queue built up during a previous offline session should flush as
    // soon as the app opens again online — don't wait for a fresh online
    // *transition* that already happened before this mounted.
    if (typeof navigator === 'undefined' || navigator.onLine) flushSyncQueue();

    const onOnline = () => {
      flushSyncQueue();
      fetchProducts();
      if (useAuthStore.getState().isAuthenticated) {
        lastFetch.current = Date.now();
        fetchEntitlements();
        fetchPurchases();
      }
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
