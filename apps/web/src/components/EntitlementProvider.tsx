'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePurchasesStore } from '@/store/purchasesStore';

const FOCUS_REFETCH_THROTTLE_MS = 10_000;

/**
 * Fetches entitlements on mount and whenever auth state changes. Also refetches
 * when the app regains focus (throttled): with the manual WhatsApp activation
 * flow, the team grants the subscription while the user is in WhatsApp — on
 * return, access must be live without re-login.
 */
export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchEntitlements = usePurchasesStore((s) => s.fetchEntitlements);
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

  return <>{children}</>;
}
