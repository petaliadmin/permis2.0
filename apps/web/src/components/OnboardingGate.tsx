'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * First-run gate: sends a fresh visitor to /onboarding once, before anything
 * else renders. Client-only (localStorage), so guests are covered too — no
 * server/account state is involved until the profile-choice screen finishes.
 */
export function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const done = localStorage.getItem('permis_onboarding_done');
    const exempt = pathname.startsWith('/onboarding') || pathname.startsWith('/auth');
    if (!done && !exempt) {
      router.replace('/onboarding');
    }
    // Only ever needs to fire on the first mount / route change while undone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
