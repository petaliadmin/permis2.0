'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isOnboardingDone } from '@/lib/onboarding';
import { useSpace } from '@/components/SpaceProvider';

/**
 * First-run gate: sends a fresh visitor to /onboarding once, before anything
 * else renders. Only on `www` — the `learn` / `school` subdomains skip the
 * feature tour + profile choice entirely (the subdomain already fixes the
 * profile). Onboarding state is a `.permis2.com` cookie so it carries across
 * subdomains.
 */
export function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const space = useSpace();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (space !== 'www') return;
    // Public/trust marketing pages a search visitor can land on directly —
    // must never bounce into the signup flow before they've seen the content.
    const PUBLIC_ROUTES = [
      '/assistance',
      '/a-propos',
      '/contact',
      '/mentions-legales',
      '/politique-confidentialite',
      '/code-route-senegal',
      '/permis-conduire-senegal',
      '/auto-ecoles-senegal',
    ];
    const exempt =
      pathname.startsWith('/onboarding') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/ecoles') ||
      PUBLIC_ROUTES.some((route) => pathname === route) ||
      pathname === '/';
    if (!isOnboardingDone() && !exempt) {
      router.replace('/onboarding');
    }
    // Only ever needs to fire on the first mount / route change while undone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, space]);

  return null;
}
