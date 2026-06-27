'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@permis2.0/ui';
import { cn } from '@/lib/cn';
import { PageTransition } from '@/components/PageTransition';

// Full nav used by the desktop top bar.
const NAV_LINKS = [
  { href: '/traffic-signs', label: 'Panneaux', icon: '🚦' },
  { href: '/exam', label: 'Examen blanc', icon: '🎯' },
  { href: '/lessons', label: 'Leçons', icon: '📚' },
  { href: '/training', label: 'Entraînement', icon: '✍️' },
];

// Primary tabs for the mobile bottom bar.
const TAB_LINKS = NAV_LINKS;

interface AppShellProps {
  children: React.ReactNode;
  /** Optional streak value (days) shown in the gamification chips */
  streak?: number;
}

export function AppShell({ children, streak = 0 }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950">
      {/* Top bar — compact on mobile, rich on desktop */}
      <header
        className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800/70 dark:bg-dark-900/80
                   pt-[env(safe-area-inset-top)]"
      >
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
          {/* Brand + desktop nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-primary text-sm font-black text-white shadow-soft sm:h-9 sm:w-9 sm:text-lg">
                P
              </span>
              <span className="text-base font-extrabold tracking-tight text-dark dark:text-white sm:text-xl">
                PERMIS<span className="text-primary">2.0</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive(link.href)
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-primary dark:text-slate-300 dark:hover:bg-dark-800'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Gamification chips + user */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <GameChip emoji="🔥" value={streak} title="Jours d'affilée" />
            <GameChip emoji="⭐" value={`${user?.xp ?? 0}`} title="Points d'expérience" />
            <span className="hidden rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 sm:inline">
              {user?.level ?? 'Débutant'}
            </span>
            <span className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold text-dark sm:h-9 sm:w-9 sm:text-sm">
              {(user?.name ?? '?').charAt(0).toUpperCase()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden lg:inline-flex"
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Content — extra bottom padding on mobile to clear the tab bar */}
      <main className="mx-auto max-w-7xl px-4 py-5 pb-28 sm:px-6 sm:py-8 lg:px-8 lg:pb-8">
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Mobile bottom tab bar — app-style with an animated active pill */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/90 backdrop-blur-xl lg:hidden dark:border-slate-800/70 dark:bg-dark-900/90
                   pb-[env(safe-area-inset-bottom)]"
        aria-label="Navigation principale"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {TAB_LINKS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className="group relative flex h-16 items-center justify-center"
              >
                <motion.span
                  whileTap={{ scale: 0.86 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                    active
                      ? 'text-primary'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  <span className="relative flex h-8 w-12 items-center justify-center">
                    {active && (
                      <motion.span
                        layoutId="tab-pill"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        className="absolute inset-0 rounded-full bg-primary-50 dark:bg-primary-900/40"
                      />
                    )}
                    <span
                      className={cn(
                        'relative text-lg transition-transform',
                        active && 'scale-110'
                      )}
                    >
                      {tab.icon}
                    </span>
                  </span>
                  <span className={cn(active && 'font-bold')}>{tab.label}</span>
                </motion.span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function GameChip({ emoji, value, title }: { emoji: string; value: React.ReactNode; title: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 dark:bg-dark-800 dark:text-slate-200"
    >
      <span>{emoji}</span>
      {value}
    </span>
  );
}
