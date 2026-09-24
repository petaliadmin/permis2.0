'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';

/** Shared header for full-width marketing pages (landing, /ecoles, /ecoles/[slug]) — outside AppShell. */
export function SiteHeader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <header className="sticky top-0 z-20 border-b border-token bg-surface-1/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-header.png"
            alt="PERMIS 2.0"
            width={700}
            height={655}
            priority
            className="h-11 w-auto sm:h-12"
          />
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
          <Link href="/tarifs" className="text-sm font-semibold text-secondary hover:text-foreground">
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
