'use client';

import { createContext, useContext, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import { useSpace, useSpaceUrl } from '@/components/SpaceProvider';
import type { Space } from '@/lib/space';

type MenuLink = { href: string; label: string; icon: string };

const LEARN_MENU: MenuLink[] = [
  { href: '/', label: 'Accueil', icon: 'ti-home' },
  { href: '/traffic-signs', label: 'Panneaux', icon: 'ti-road-sign' },
  { href: '/cours', label: 'Cours', icon: 'ti-book-2' },
  { href: '/quizz', label: 'Quiz', icon: 'ti-cards' },
  { href: '/exam', label: 'Examens', icon: 'ti-clipboard-check' },
  { href: '/boutique', label: 'Abonnement', icon: 'ti-crown' },
  { href: '/mes-auto-ecoles', label: 'Mes auto-écoles', icon: 'ti-user-check' },
  { href: '/notifications', label: 'Notifications', icon: 'ti-bell' },
  { href: '/assistance', label: 'Assistance', icon: 'ti-headset' },
  { href: '/profil', label: 'Profil & réglages', icon: 'ti-user' },
];

const SCHOOL_MENU: MenuLink[] = [
  { href: '/', label: 'Tableau de bord', icon: 'ti-layout-dashboard' },
  { href: '/auto-ecole', label: 'Packs premium', icon: 'ti-crown' },
  { href: '/assistance', label: 'Assistance', icon: 'ti-headset' },
  { href: '/profil', label: 'Profil & réglages', icon: 'ti-user' },
];

export function menuForSpace(space: Space): MenuLink[] {
  return space === 'school' ? SCHOOL_MENU : LEARN_MENU;
}

/* ─── Context ────────────────────────────────────────────────────────────────── */
const SideMenuContext = createContext<{ open: () => void }>({ open: () => {} });

/** Opens the global side menu from any component under <SideMenuProvider>. */
export function useSideMenu() {
  return useContext(SideMenuContext);
}

/* ─── Hamburger button ───────────────────────────────────────────────────────── */
export function MenuButton({ className }: { className?: string }) {
  const { open } = useSideMenu();
  return (
    <button
      onClick={open}
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-secondary transition-colors hover:bg-surface-3',
        className
      )}
      aria-label="Ouvrir le menu"
    >
      <i className="ti ti-menu-2 text-lg" aria-hidden="true" />
    </button>
  );
}

/* ─── Drawer ─────────────────────────────────────────────────────────────────── */
function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const space = useSpace();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const links = menuForSpace(space);
  const crossSpaceHref = useSpaceUrl(space === 'school' ? 'learn' : 'school');

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/45"
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[290px] max-w-[85vw] flex-col bg-surface-1 shadow-2xl"
            role="dialog"
            aria-label="Menu principal"
          >
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
                {space === 'school' && (
                  <span className="ml-1.5 text-sm font-semibold text-white/70">· Auto-école</span>
                )}
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

            <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Menu">
              {links.map((l) => {
                const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
                return (
                  <button
                    key={l.href}
                    onClick={() => go(l.href)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-colors',
                      active ? 'bg-primary-50 text-primary-700' : 'text-foreground hover:bg-surface-2'
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

              {space !== 'www' && crossSpaceHref && (
                <a
                  href={crossSpaceHref}
                  className="mt-1 flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-left text-sm font-semibold text-secondary transition-colors hover:bg-surface-2"
                >
                  <i
                    className={cn(
                      'ti text-xl text-secondary',
                      space === 'school' ? 'ti-school' : 'ti-building-store'
                    )}
                    aria-hidden="true"
                  />
                  {space === 'school' ? 'Espace élève' : 'Espace auto-école'}
                  <i className="ti ti-external-link ml-auto text-sm text-muted" aria-hidden="true" />
                </a>
              )}

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

/** Provides the side-menu context + renders the drawer. Wrap any shell in it. */
export function SideMenuProvider({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <SideMenuContext.Provider value={{ open: () => setMenuOpen(true) }}>
      {children}
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </SideMenuContext.Provider>
  );
}
