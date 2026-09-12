type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
  }
}

/** No-op when GA isn't loaded (dev, or NEXT_PUBLIC_GA_MEASUREMENT_ID unset) — safe to call unconditionally. */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
