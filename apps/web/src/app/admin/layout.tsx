'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSpaceUrl } from '@/components/SpaceProvider';
import { useAdminGuard, AccessDenied, ADMIN_SECTIONS, adminFetch } from './adminShared';
import {
  IconArrowLeft,
  IconChevronRight,
  IconExternalLink,
  IconShieldLock,
  IconLayoutDashboard,
} from '@tabler/icons-react';

const NAV = [
  { href: '/admin', label: 'Tableau de bord', icon: IconLayoutDashboard },
  ...ADMIN_SECTIONS.map((s) => ({ href: s.href, label: s.label, icon: s.icon })),
];

function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [pendingCount, setPendingCount] = useState(0);
  const backToSiteHref = useSpaceUrl('learn', '/profil');

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
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[268px] flex-col border-r border-white/10 bg-[#00235E]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 pb-5 pt-7">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-base font-black text-white">
          P
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm font-extrabold leading-tight text-white">
            PERMIS<span className="text-white/70">2.0</span>
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
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
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white transition-colors ${
                active ? 'bg-white/15' : 'hover:bg-white/10'
              }`}
            >
              <item.icon size="1em" className="text-lg text-white" aria-hidden="true" />
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
      <div className="border-t border-white/10 px-3.5 py-3.5">
        <a
          href={backToSiteHref ?? '/profil'}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          <IconArrowLeft size="1em" className="text-lg text-white" aria-hidden="true" />
          Retour au site
        </a>
        {user && (
          <div className="mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[#00235E]">
              {user.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <p className="min-w-0 truncate text-xs font-semibold text-white">{user.name}</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function Topbar() {
  const pathname = usePathname();
  const siteHref = useSpaceUrl('www', '/');
  const current =
    NAV.slice()
      .reverse()
      .find((item) => (item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)))
      ?.label ?? 'Administration';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-token bg-surface-1/85 px-8 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
        <IconShieldLock size="1em" className="text-base text-violet-500" aria-hidden="true" />
        <span>Admin</span>
        <IconChevronRight size="1em" className="text-xs text-slate-300" aria-hidden="true" />
        <span className="text-foreground">{current}</span>
      </div>
      <a
        href={siteHref ?? '/'}
        className="flex items-center gap-1.5 rounded-full border border-token bg-surface-2 px-3.5 py-1.5 text-xs font-bold text-secondary transition-colors hover:border-violet-300 hover:text-violet-600"
      >
        <IconExternalLink size="1em" className="text-sm" aria-hidden="true" />
        Voir le site
      </a>
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
            'radial-gradient(600px circle at 0% 0%, #7C3AED, transparent), radial-gradient(500px circle at 100% 0%, #003EA8, transparent)',
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
