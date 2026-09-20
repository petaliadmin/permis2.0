'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { PageTransition } from '@/components/PageTransition';
import { useSpace } from '@/components/SpaceProvider';
import { SideMenuProvider, MenuButton, useSideMenu } from '@/components/SideMenu';
import type { Space } from '@/lib/space';
import {
  IconChevronLeft,
  IconWifiOff,
  IconHome,
  IconRoadSign,
  IconCards,
  IconClipboardCheck,
  IconUser,
} from '@tabler/icons-react';

type IconComponent = React.ComponentType<{
  size?: string | number;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}>;

export { MenuButton, useSideMenu };

/* ─── Offline banner ─────────────────────────────────────────────────────────── */
function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed inset-x-0 top-0 z-50 mx-auto max-w-md"
          role="status"
        >
          <div className="flex items-center justify-center gap-2 bg-slate-800 px-4 py-2 pt-[calc(env(safe-area-inset-top)+8px)] text-xs font-semibold text-white">
            <IconWifiOff size="1em" aria-hidden="true" />
            Tu es hors ligne — ta progression locale est conservée
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Section accent map ─────────────────────────────────────────────────────── */
type Accent = 'blue' | 'violet' | 'orange';

const ACCENT: Record<Accent, { grad: string; text: string; solid: string; soft: string }> = {
  blue: {
    grad: 'from-primary-600 to-primary-800',
    text: 'text-primary-600',
    solid: 'bg-primary-600',
    soft: 'bg-primary-50',
  },
  violet: {
    grad: 'from-violet-600 to-violet-700',
    text: 'text-violet-600',
    solid: 'bg-violet-600',
    soft: 'bg-violet-50',
  },
  orange: {
    grad: 'from-orange-500 to-orange-600',
    text: 'text-orange-500',
    solid: 'bg-orange-500',
    soft: 'bg-orange-50',
  },
};

/* ─── Navigation ─────────────────────────────────────────────────────────────── */
type TabLink = { href: string; label: string; icon: IconComponent; accent: Accent };

const LEARN_TABS: TabLink[] = [
  { href: '/', label: 'Accueil', icon: IconHome, accent: 'blue' },
  { href: '/traffic-signs', label: 'Panneaux', icon: IconRoadSign, accent: 'blue' },
  { href: '/quizz', label: "Je m'entraine", icon: IconCards, accent: 'violet' },
  { href: '/exam', label: 'Examens', icon: IconClipboardCheck, accent: 'orange' },
  { href: '/profil', label: 'Profil', icon: IconUser, accent: 'violet' },
];

/** Bottom tabs only make sense in the student (learn) space. */
function tabsForSpace(space: Space): TabLink[] {
  return space === 'learn' ? LEARN_TABS : [];
}

interface AppShellProps {
  children: React.ReactNode;
  hideNav?: boolean;
  /** Removes the default horizontal padding so a page can render a full-bleed header. */
  padded?: boolean;
}

export function AppShell({ children, hideNav = false, padded = false }: AppShellProps) {
  const pathname = usePathname();
  const space = useSpace();

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const tabs = tabsForSpace(space);
  const showTabs = !hideNav && tabs.length > 0;

  return (
    <SideMenuProvider>
      <div className="on-light min-h-screen bg-surface">
        <OfflineBanner />
        <main
          id="main-content"
          className={cn(
            'mx-auto min-h-screen w-full max-w-md bg-surface',
            padded && 'px-4 py-5',
            showTabs && 'pb-28'
          )}
        >
          <PageTransition>{children}</PageTransition>
        </main>

        {/* ── Bottom navigation — student space only */}
        {showTabs && (
          <nav
            className={cn(
              'fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-token bg-surface-1/95 shadow-nav backdrop-blur-xl pb-[env(safe-area-inset-bottom)]'
            )}
            aria-label="Navigation principale"
          >
            <div className={cn('grid', tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4')}>
              {tabs.map((tab) => {
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
                    <motion.span whileTap={{ scale: 0.82 }} className="inline-flex">
                      <tab.icon
                        size="1em"
                        className={cn(
                          'text-[22px] transition-colors',
                          active ? a.text : 'text-slate-400 group-hover:text-slate-500'
                        )}
                        aria-hidden="true"
                      />
                    </motion.span>
                    <span
                      className={cn(
                        'text-[10px] font-bold tracking-wide transition-colors',
                        active ? a.text : 'text-slate-400'
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
    </SideMenuProvider>
  );
}

const ACCENT_CHIP: Record<Accent, string> = {
  blue: 'chip-primary',
  violet: 'chip-violet',
  orange: 'chip-orange',
};

/* ─── PageHeader — light section header (matches the marketing site) ─────────── */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  accent?: Accent;
  /** Optional back link href; when set, shows a back chevron. */
  back?: string;
  /** Shows the hamburger that opens the global side menu. */
  menu?: boolean;
  /** Right-side action nodes. */
  actions?: React.ReactNode;
  /** Extra content rendered below the title row (e.g. a search bar or tabs). */
  children?: React.ReactNode;
  /** Compact removes the large vertical padding. */
  compact?: boolean;
  /** Small kicker shown in the accent chip above the title. */
  eyebrow?: string;
}

export function PageHeader({
  title,
  subtitle,
  accent = 'blue',
  back,
  menu,
  actions,
  children,
  compact,
  eyebrow,
}: PageHeaderProps) {
  return (
    <header className="border-b border-token bg-surface-1">
      <div
        className={cn(
          'mx-auto max-w-md px-5 pt-[calc(env(safe-area-inset-top)+16px)]',
          compact ? 'pb-4' : 'pb-5'
        )}
      >
        <div className="flex items-center gap-3">
          {back ? (
            <Link
              href={back}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-secondary transition-colors hover:bg-surface-3"
              aria-label="Retour"
            >
              <IconChevronLeft size="1em" className="text-lg" aria-hidden="true" />
            </Link>
          ) : menu ? (
            <MenuButton />
          ) : null}

          <div className="min-w-0 flex-1">
            {eyebrow && (
              <span className={cn('chip mb-1', ACCENT_CHIP[accent])}>{eyebrow}</span>
            )}
            <h1 className="truncate font-display text-xl font-extrabold leading-tight text-foreground">
              {title}
            </h1>
            {subtitle && <p className="mt-0.5 truncate text-xs text-secondary">{subtitle}</p>}
          </div>

          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>

        {children && <div className="mt-4">{children}</div>}
      </div>
    </header>
  );
}

export { ACCENT };
