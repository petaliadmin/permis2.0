'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isOnboardingDone } from '@/lib/onboarding';

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
    // '/' is exempt on every space: each subdomain's root is a valid entry
    // point (landing / student home / school dashboard). '/ecoles' is linked
    // straight from the landing. Onboarding state is a `.permis2.com` cookie so
    // it carries across www / learn / school.
    const exempt =
      pathname.startsWith('/onboarding') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/ecoles') ||
      pathname === '/';
    if (!isOnboardingDone() && !exempt) {
      router.replace('/onboarding');
    }
    // Only ever needs to fire on the first mount / route change while undone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
