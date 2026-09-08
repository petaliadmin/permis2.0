'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Rehydrates the auth UI state from the shared httpOnly cookie on every load.
 *
 * The zustand `persist` store is per-origin, so a valid session established on
 * one subdomain (www) carries no client state to the others (learn / school).
 * The `.permis2.com` cookie *is* shared, so `GET /auth/me` is the source of
 * truth: adopt the user it returns, or clear a stale persisted session on 401.
 */
export function SessionSync() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : r.status === 401 ? 'unauthorized' : null))
      .then((result) => {
        if (cancelled || result === null) return; // network/5xx: keep whatever we have
        if (result === 'unauthorized') {
          if (useAuthStore.getState().isAuthenticated) setUser(null);
          return;
        }
        if (result && typeof result === 'object' && 'id' in result) setUser(result);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  return null;
}
