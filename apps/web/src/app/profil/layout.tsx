import type { Metadata } from 'next';

// Audit finding — robots.txt disallows /profil but the page had no <meta
// robots> override, so it inherited the root layout's index:true,follow:true
// default (same gap as /auth/* and /notifications). Page itself stays a
// client component ('use client'), so the override lives in this layout —
// same pattern as /onboarding/layout.tsx.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  return children;
}
