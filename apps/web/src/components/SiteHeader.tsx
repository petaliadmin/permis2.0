'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

/** Shared header for full-width marketing pages (landing, /ecoles, /ecoles/[slug]) — outside AppShell. */
export function SiteHeader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <header className="sticky top-0 z-20 border-b border-token bg-surface-1/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-sm font-black text-white">
            P
          </span>
          <span className="font-display text-sm font-extrabold text-foreground sm:text-base">
            PERMIS<span className="text-primary-600">2.0</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Navigation principale">
          <Link href="/" className="text-sm font-semibold text-secondary hover:text-foreground">
            Accueil
          </Link>
          <Link href="/ecoles" className="text-sm font-semibold text-secondary hover:text-foreground">
            Auto-écoles
          </Link>
          <Link href="/#services" className="text-sm font-semibold text-secondary hover:text-foreground">
            Nos services
          </Link>
          <Link href="/#erp" className="text-sm font-semibold text-secondary hover:text-foreground">
            ERP
          </Link>
          <Link href="/boutique" className="text-sm font-semibold text-secondary hover:text-foreground">
            Tarifs
          </Link>
          <Link href="/#faq" className="text-sm font-semibold text-secondary hover:text-foreground">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link href="/profil" className="btn-ghost !px-4 !py-2 text-sm">
              Mon espace
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="hidden text-sm font-semibold text-secondary hover:text-foreground sm:inline"
              >
                Se connecter
              </Link>
              <Link href="/onboarding" className="btn-primary !px-4 !py-2 text-sm">
                Commencer
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
