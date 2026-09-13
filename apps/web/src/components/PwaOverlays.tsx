'use client';

import dynamic from 'next/dynamic';

// Both overlays are pure client-side UI (localStorage/sessionStorage/timers
// gated) with nothing to render on the server, and both pull in framer-motion.
// Loading them off the main chunk keeps that library out of the JS every
// visitor has to parse/execute before the page is interactive — previously
// they were imported directly in the root layout, so framer-motion shipped
// on every single route including anonymous marketing traffic.
const InstallPrompt = dynamic(
  () => import('@/components/pwa/InstallPrompt').then((m) => m.InstallPrompt),
  { ssr: false }
);
const PushPermissionBanner = dynamic(
  () => import('@/components/PushPermissionBanner').then((m) => m.PushPermissionBanner),
  { ssr: false }
);

export function PwaOverlays() {
  return (
    <>
      <InstallPrompt />
      <PushPermissionBanner />
    </>
  );
}
