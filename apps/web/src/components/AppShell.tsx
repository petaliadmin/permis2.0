'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { PageTransition } from '@/components/PageTransition';
import { ThemeInit } from '@/components/ThemeInit';

/* ─── Section accent map ─────────────────────────────────────────────────────── */
type Accent = 'blue' | 'violet' | 'orange';

const ACCENT: Record<Accent, { grad: string; text: string; solid: string; soft: string }> = {
  blue:   { grad: 'from-primary-600 to-primary-800', text: 'text-primary-600', solid: 'bg-primary-600', soft: 'bg-primary-50' },
  violet: { grad: 'from-violet-600 to-violet-700',   text: 'text-violet-600',  solid: 'bg-violet-600',  soft: 'bg-violet-50' },
  orange: { grad: 'from-orange-500 to-orange-600',   text: 'text-orange-500',  solid: 'bg-orange-500',  soft: 'bg-orange-50' },
};

/* ─── Navigation ─────────────────────────────────────────────────────────────── */
const TAB_LINKS: { href: string; label: string; icon: string; accent: Accent }[] = [
  { href: '/',              label: 'Accueil',  icon: 'ti-home-2',         accent: 'blue'   },
  { href: '/traffic-signs', label: 'Panneaux', icon: 'ti-road-sign',      accent: 'blue'   },
  { href: '/quizz',         label: 'Quiz',     icon: 'ti-cards',          accent: 'violet' },
  { href: '/exam',          label: 'Examens',  icon: 'ti-clipboard-check',accent: 'orange' },
  { href: '/profil',        label: 'Profil',   icon: 'ti-user',           accent: 'violet' },
];

interface AppShellProps {
  children: React.ReactNode;
  hideNav?: boolean;
  /** Removes the default horizontal padding so a page can render a full-bleed header. */
  padded?: boolean;
}

export function AppShell({ children, hideNav = false, padded = false }: AppShellProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-surface">
      <ThemeInit />

      <main
        id="main-content"
        className={cn(
          'mx-auto min-h-screen w-full max-w-md bg-surface',
          padded && 'px-4 py-5',
          !hideNav && 'pb-28',
        )}
      >
        <PageTransition>{children}</PageTransition>
      </main>

      {/* ── Bottom navigation — 5 tabs (mockup) */}
      {!hideNav && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-token bg-surface-1/95 shadow-nav backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
          aria-label="Navigation principale"
        >
          <div className="grid grid-cols-5">
            {TAB_LINKS.map((tab) => {
              const active = isActive(tab.href);
              const a = ACCENT[tab.accent];
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className="group relative flex h-16 flex-col items-center justify-center gap-1"
                >
                  {active && (
                    <motion.span
                      layoutId="tab-indicator"
                      className={cn('absolute top-0 h-1 w-9 rounded-full', a.solid)}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <motion.i
                    whileTap={{ scale: 0.82 }}
                    className={cn(
                      `ti ${tab.icon} text-[22px] transition-colors`,
                      active ? a.text : 'text-slate-400 group-hover:text-slate-500',
                    )}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      'text-[10px] font-bold tracking-wide transition-colors',
                      active ? a.text : 'text-slate-400',
                    )}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

/* ─── PageHeader — full-bleed colored header used by each section ─────────────── */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  accent?: Accent;
  /** Optional back link href; when set, shows a back chevron. */
  back?: string;
  /** Renders a menu icon on the left instead of nothing. */
  menu?: boolean;
  /** Right-side action nodes. */
  actions?: React.ReactNode;
  /** Extra content rendered below the title row (e.g. a search bar or tabs). */
  children?: React.ReactNode;
  /** Compact removes the large vertical padding. */
  compact?: boolean;
}

export function PageHeader({
  title, subtitle, accent = 'blue', back, menu, actions, children, compact,
}: PageHeaderProps) {
  const a = ACCENT[accent];
  return (
    <header
      className={cn(
        'relative overflow-hidden rounded-b-[28px] bg-gradient-to-br text-white shadow-lg',
        a.grad,
      )}
    >
      {/* soft decorative blobs */}
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -left-8 top-10 h-24 w-24 rounded-full bg-white/5" />

      <div className={cn('relative px-5 pt-[calc(env(safe-area-inset-top)+16px)]', compact ? 'pb-4' : 'pb-6')}>
        <div className="flex items-center gap-3">
          {back ? (
            <Link
              href={back}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
              aria-label="Retour"
            >
              <i className="ti ti-chevron-left text-lg" aria-hidden="true" />
            </Link>
          ) : menu ? (
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15"
              aria-label="Menu"
            >
              <i className="ti ti-menu-2 text-lg" aria-hidden="true" />
            </button>
          ) : null}

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-extrabold leading-tight">{title}</h1>
            {subtitle && <p className="mt-0.5 truncate text-xs text-white/80">{subtitle}</p>}
          </div>

          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>

        {children && <div className="mt-4">{children}</div>}
      </div>
    </header>
  );
}

export { ACCENT };
