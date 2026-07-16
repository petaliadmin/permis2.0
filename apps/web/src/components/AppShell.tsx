'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { PageTransition } from '@/components/PageTransition';
import { useAuthStore } from '@/store/authStore';

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
            <i className="ti ti-wifi-off" aria-hidden="true" />
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

/* ─── Side menu (global drawer) ──────────────────────────────────────────────── */
const SideMenuContext = createContext<{ open: () => void }>({ open: () => {} });

/** Opens the global side menu from any component under AppShell. */
export function useSideMenu() {
  return useContext(SideMenuContext);
}

const MENU_LINKS: { href: string; label: string; icon: string }[] = [
  { href: '/cours', label: 'Cours', icon: 'ti-book' },
  { href: '/traffic-signs', label: 'Panneaux', icon: 'ti-road-sign' },
  { href: '/quizz', label: 'Quiz', icon: 'ti-cards' },
  { href: '/exam', label: 'Examens', icon: 'ti-clipboard-check' },
  { href: '/boutique', label: 'Abonnement', icon: 'ti-crown' },
  { href: '/notifications', label: 'Notifications', icon: 'ti-bell' },
  { href: '/assistance', label: 'Assistance', icon: 'ti-headset' },
  { href: '/profil', label: 'Profil & réglages', icon: 'ti-user' },
];

function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/45"
            aria-hidden="true"
          />
          {/* Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[290px] max-w-[85vw] flex-col bg-surface-1 shadow-2xl"
            role="dialog"
            aria-label="Menu principal"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 px-5 pb-5 pt-[calc(env(safe-area-inset-top)+20px)] text-white">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-xl font-black backdrop-blur">
                  P
                </span>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15"
                  aria-label="Fermer le menu"
                >
                  <i className="ti ti-x text-sm" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-3 font-display text-lg font-extrabold leading-tight">
                PERMIS<span className="text-primary-200">2.0</span>
              </p>
              {isAuthenticated && user ? (
                <button onClick={() => go('/profil')} className="mt-1 flex items-center gap-1.5">
                  <span className="text-sm text-white/85">{user.name}</span>
                  <i className="ti ti-chevron-right text-xs text-white/60" aria-hidden="true" />
                </button>
              ) : (
                <button
                  onClick={() => go('/auth/login')}
                  className="mt-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold"
                >
                  Se connecter
                </button>
              )}
            </div>

            {/* Links */}
            <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Menu">
              {MENU_LINKS.map((l) => {
                const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
                return (
                  <button
                    key={l.href}
                    onClick={() => go(l.href)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-colors',
                      active
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-foreground hover:bg-surface-2'
                    )}
                  >
                    <i
                      className={cn(
                        `ti ${l.icon} text-xl`,
                        active ? 'text-primary-600' : 'text-secondary'
                      )}
                      aria-hidden="true"
                    />
                    {l.label}
                  </button>
                );
              })}
              {String(user?.role) === 'ADMIN' && (
                <button
                  onClick={() => go('/admin')}
                  className="mt-1 flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-left text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-50"
                >
                  <i className="ti ti-shield-lock text-xl" aria-hidden="true" />
                  Administration
                </button>
              )}
            </nav>

            {/* Footer */}
            <div className="border-t border-token px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
              {isAuthenticated ? (
                <button
                  onClick={async () => {
                    onClose();
                    await logout();
                    router.push('/auth/login');
                  }}
                  className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                >
                  <i className="ti ti-logout text-xl" aria-hidden="true" />
                  Se déconnecter
                </button>
              ) : (
                <p className="px-3.5 text-center text-[10px] text-muted">
                  PERMIS 2.0 · Made with ❤️ in Dakar
                </p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Navigation ─────────────────────────────────────────────────────────────── */
const TAB_LINKS: { href: string; label: string; icon: string; accent: Accent }[] = [
  { href: '/traffic-signs', label: 'Panneaux', icon: 'ti-road-sign', accent: 'blue' },
  { href: '/quizz', label: "Je m'entraine", icon: 'ti-cards', accent: 'violet' },
  { href: '/exam', label: 'Examens', icon: 'ti-clipboard-check', accent: 'orange' },
  { href: '/profil', label: 'Profil', icon: 'ti-user', accent: 'violet' },
];

interface AppShellProps {
  children: React.ReactNode;
  hideNav?: boolean;
  /** Removes the default horizontal padding so a page can render a full-bleed header. */
  padded?: boolean;
}

export function AppShell({ children, hideNav = false, padded = false }: AppShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <SideMenuContext.Provider value={{ open: () => setMenuOpen(true) }}>
      <div className="min-h-screen bg-surface">
        <OfflineBanner />
        <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main
          id="main-content"
          className={cn(
            'mx-auto min-h-screen w-full max-w-md bg-surface',
            padded && 'px-4 py-5',
            !hideNav && 'pb-28'
          )}
        >
          <PageTransition>{children}</PageTransition>
        </main>

        {/* ── Bottom navigation — 4 tabs (mockup) */}
        {!hideNav && (
          <nav
            className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-token bg-surface-1/95 shadow-nav backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
            aria-label="Navigation principale"
          >
            <div className="grid grid-cols-4">
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
                        active ? a.text : 'text-slate-400 group-hover:text-slate-500'
                      )}
                      aria-hidden="true"
                    />
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
    </SideMenuContext.Provider>
  );
}

/* ─── MenuButton — hamburger that opens the global side menu ─────────────────── */
export function MenuButton({ className }: { className?: string }) {
  const { open } = useSideMenu();
  return (
    <button
      onClick={open}
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25',
        className
      )}
      aria-label="Ouvrir le menu"
    >
      <i className="ti ti-menu-2 text-lg" aria-hidden="true" />
    </button>
  );
}

/* ─── PageHeader — full-bleed colored header used by each section ─────────────── */
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
}: PageHeaderProps) {
  const a = ACCENT[accent];
  return (
    <header
      className={cn(
        'relative overflow-hidden rounded-b-[28px] bg-gradient-to-br text-white shadow-lg',
        a.grad
      )}
    >
      {/* soft decorative blobs */}
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -left-8 top-10 h-24 w-24 rounded-full bg-white/5" />

      <div
        className={cn(
          'relative px-5 pt-[calc(env(safe-area-inset-top)+16px)]',
          compact ? 'pb-4' : 'pb-6'
        )}
      >
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
            <MenuButton />
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
