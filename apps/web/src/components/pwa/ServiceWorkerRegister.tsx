'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker on the client. Rendered once from the root layout.
 * Silent no-op on browsers without SW support or during local non-secure contexts
 * other than localhost (SW requires HTTPS or localhost).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Never run the caching service worker in development: it intercepts
    // Next.js's constantly-changing _next/static chunks and breaks HMR.
    // Unregister any SW left over from a previous prod build / earlier session.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => console.warn('SW registration failed:', err));
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
