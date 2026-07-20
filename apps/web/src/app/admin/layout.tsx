'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useAdminGuard, AccessDenied, ADMIN_SECTIONS, adminFetch } from './adminShared';

const NAV = [
  { href: '/admin', label: 'Tableau de bord', icon: 'ti-layout-dashboard' },
  ...ADMIN_SECTIONS.map((s) => ({ href: s.href, label: s.label, icon: s.icon })),
];

function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    adminFetch<{ id: string }[]>('/admin/purchases?status=PENDING')
      .then((rows) => setPendingCount(rows.length))
      .catch(() => {});
    // Refetch whenever the admin navigates — cheap query, keeps the badge fresh
    // after confirming a request on the Demandes page.
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[268px] flex-col border-r border-token bg-surface-1">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 pb-5 pt-7">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 text-base font-black text-white shadow-glow-violet">
          P
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm font-extrabold leading-tight text-foreground">
            PERMIS<span className="text-violet-600">2.0</span>
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Administration
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3.5 py-2" aria-label="Navigation admin">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/25 dark:text-violet-300'
                  : 'text-secondary hover:bg-surface-2 hover:text-foreground'
              }`}
            >
              <i
                className={`ti ${item.icon} text-lg ${active ? 'text-violet-600 dark:text-violet-300' : 'text-slate-400'}`}
                aria-hidden="true"
              />
              <span className="flex-1">{item.label}</span>
              {item.href === '/admin/demandes' && pendingCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-success-500 px-1.5 text-[10px] font-black text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-token px-3.5 py-3.5">
        <Link
          href="/profil"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <i className="ti ti-arrow-left text-lg text-slate-400" aria-hidden="true" />
          Retour au site
        </Link>
        {user && (
          <div className="mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              {user.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <p className="min-w-0 truncate text-xs font-semibold text-secondary">{user.name}</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function Topbar() {
  const pathname = usePathname();
  const current =
    NAV.slice()
      .reverse()
      .find((item) => (item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)))
      ?.label ?? 'Administration';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-token bg-surface-1/85 px-8 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
        <i className="ti ti-shield-lock text-base text-violet-500" aria-hidden="true" />
        <span>Admin</span>
        <i className="ti ti-chevron-right text-xs text-slate-300" aria-hidden="true" />
        <span className="text-foreground">{current}</span>
      </div>
      <Link
        href="/"
        className="flex items-center gap-1.5 rounded-full border border-token bg-surface-2 px-3.5 py-1.5 text-xs font-bold text-secondary transition-colors hover:border-violet-300 hover:text-violet-600"
      >
        <i className="ti ti-external-link text-sm" aria-hidden="true" />
        Voir le site
      </Link>
    </header>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const allowed = useAdminGuard();

  if (allowed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (allowed === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <AccessDenied />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-surface">
      {/* Soft premium backdrop — a faint violet glow anchored top-left, purely decorative */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.06]"
        style={{
          background:
            'radial-gradient(600px circle at 0% 0%, #7C3AED, transparent), radial-gradient(500px circle at 100% 0%, #2563EB, transparent)',
        }}
        aria-hidden="true"
      />

      <Sidebar />

      <div className="relative z-10 pl-[268px]">
        <Topbar />
        <main className="mx-auto max-w-[1400px] px-10 py-9">{children}</main>
      </div>
    </div>
  );
}
