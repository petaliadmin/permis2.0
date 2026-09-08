'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SiteFooter } from '@/components/SiteFooter';
import { useAuthStore } from '@/store/authStore';
import { SideMenuProvider, MenuButton } from '@/components/SideMenu';

/**
 * Chrome for the auto-école space (school.permis2.com). Desktop-first, no
 * bottom tab bar — the management screens carry their own tabs. Navigation
 * (dashboard, packs, assistance, profil, admin, espace élève, logout) lives in
 * the hamburger drawer. Light theme, matching the marketing site.
 */
function SchoolShellInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="on-light flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-token bg-surface-1/90 px-4 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3">
          <MenuButton />
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-sm font-black text-white">
              P
            </span>
            <span className="font-display text-sm font-extrabold text-foreground">
              PERMIS<span className="text-primary-600">2.0</span>
              <span className="ml-1.5 hidden font-semibold text-muted sm:inline">· Auto-école</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <button
              onClick={() => router.push('/profil')}
              className="flex h-9 items-center gap-2 rounded-full border border-token bg-surface-2 pl-1 pr-3 text-xs font-bold text-secondary"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                {user.name?.charAt(0).toUpperCase() || '?'}
              </span>
              <span className="hidden max-w-[120px] truncate sm:inline">{user.name}</span>
            </button>
          ) : (
            <button
              onClick={() => router.push('/auth/login?redirect=/')}
              className="btn bg-primary-600 px-4 py-2 text-xs text-white"
            >
              Se connecter
            </button>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function SchoolShell({ children }: { children: React.ReactNode }) {
  return (
    <SideMenuProvider>
      <SchoolShellInner>{children}</SchoolShellInner>
    </SideMenuProvider>
  );
}
