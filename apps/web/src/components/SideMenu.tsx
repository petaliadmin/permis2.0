'use client';

import { createContext, useContext, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import { useSpace, useSpaceUrl } from '@/components/SpaceProvider';
import type { Space } from '@/lib/space';
import {
  IconChevronRight,
  IconExternalLink,
  IconLogout,
  IconMenu2,
  IconX,
  IconHome,
  IconRoadSign,
  IconBook2,
  IconCards,
  IconClipboardCheck,
  IconCrown,
  IconUserCheck,
  IconBell,
  IconHeadset,
  IconUser,
  IconLayoutDashboard,
  IconSchool,
  IconBuildingStore,
} from '@tabler/icons-react';

type IconComponent = React.ComponentType<{
  size?: string | number;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}>;

type MenuLink = { href: string; label: string; icon: IconComponent };

const LEARN_MENU: MenuLink[] = [
  { href: '/', label: 'Accueil', icon: IconHome },
  { href: '/traffic-signs', label: 'Panneaux', icon: IconRoadSign },
  { href: '/cours', label: 'Cours', icon: IconBook2 },
  { href: '/quizz', label: 'Quiz', icon: IconCards },
  { href: '/exam', label: 'Examens', icon: IconClipboardCheck },
  { href: '/abonnement', label: 'Abonnement', icon: IconCrown },
  { href: '/mes-auto-ecoles', label: 'Mes auto-écoles', icon: IconUserCheck },
  { href: '/notifications', label: 'Notifications', icon: IconBell },
  { href: '/assistance', label: 'Assistance', icon: IconHeadset },
  { href: '/profil', label: 'Profil & réglages', icon: IconUser },
];

const SCHOOL_MENU: MenuLink[] = [
  { href: '/', label: 'Tableau de bord', icon: IconLayoutDashboard },
  { href: '/assistance', label: 'Assistance', icon: IconHeadset },
  { href: '/profil', label: 'Profil & réglages', icon: IconUser },
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
      <IconMenu2 size="1em" className="text-lg" aria-hidden="true" />
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
                  <IconX size="1em" className="text-sm" aria-hidden="true" />
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
                  <IconChevronRight size="1em" className="text-xs text-white/60" aria-hidden="true" />
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
                    <l.icon
                      size="1em"
                      className={cn('text-xl', active ? 'text-primary-600' : 'text-secondary')}
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
                  {space === 'school' ? (
                    <IconSchool size="1em" className="text-xl text-secondary" aria-hidden="true" />
                  ) : (
                    <IconBuildingStore size="1em" className="text-xl text-secondary" aria-hidden="true" />
                  )}
                  {space === 'school' ? 'Espace élève' : 'Espace auto-école'}
                  <IconExternalLink size="1em" className="ml-auto text-sm text-muted" aria-hidden="true" />
                </a>
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
                  <IconLogout size="1em" className="text-xl" aria-hidden="true" />
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
