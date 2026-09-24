'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AppShell, MenuButton } from '@/components/AppShell';
import { useAuthStore } from '@/store/authStore';
import { countErrors } from '@/lib/errorBank';
import {
  IconBook2,
  IconChevronRight,
  IconTargetArrow,
  IconUserPlus,
  IconRoadSign,
  IconCards,
  IconClipboardCheck,
  IconCrown,
} from '@tabler/icons-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Stats {
  xp: number;
  level: string;
  streak: number;
  quizAnswered: number;
  examCount: number;
}

const TILES = [
  {
    href: '/traffic-signs',
    label: 'Panneaux',
    desc: 'Tous les panneaux du code sénégalais',
    icon: IconRoadSign,
    accent: 'chip-primary',
    ring: 'hover:border-primary-200',
  },
  {
    href: '/quizz',
    label: "Je m'entraîne",
    desc: 'Séries de quiz par thème',
    icon: IconCards,
    accent: 'chip-violet',
    ring: 'hover:border-violet-200',
  },
  {
    href: '/exam',
    label: 'Examens blancs',
    desc: "Dans les conditions du jour J",
    icon: IconClipboardCheck,
    accent: 'chip-orange',
    ring: 'hover:border-orange-200',
  },
  {
    href: '/abonnement',
    label: 'Abonnement',
    desc: 'Débloque tout le contenu premium',
    icon: IconCrown,
    accent: 'chip-xp',
    ring: 'hover:border-amber-200',
  },
] as const;

function firstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] ?? '';
}

export default function StudentHome() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [stats, setStats] = useState<Stats | null>(null);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${API_URL}/users/stats`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    setErrorCount(countErrors());
  }, []);

  const xp = stats?.xp ?? user?.xp ?? 0;
  const level = stats?.level ?? user?.level ?? 'Débutant';
  const streak = stats?.streak ?? 0;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, []);

  return (
    <AppShell>
      <div className="on-light bg-surface px-4 pt-[calc(env(safe-area-inset-top)+16px)]">
        <div className="mx-auto max-w-md">
          {/* ── Top bar ── */}
          <div className="flex items-center justify-between">
            <MenuButton />
            <span className="font-display text-sm font-extrabold text-foreground">
              PERMIS<span className="text-primary-600">2.0</span>
            </span>
            {isAuthenticated ? (
              <Link
                href="/profil"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-black text-primary-700"
              >
                {firstName(user?.name).charAt(0).toUpperCase() || '?'}
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold text-secondary"
              >
                Se connecter
              </Link>
            )}
          </div>

          {/* ── Greeting ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5"
          >
            <p className="text-sm font-semibold text-secondary">
              {greeting}
              {isAuthenticated && firstName(user?.name) ? `, ${firstName(user?.name)}` : ''} 👋
            </p>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-foreground">
              Prêt à réviser le code ?
            </h1>
          </motion.div>

          {/* ── Progress / guest nudge ── */}
          {isAuthenticated ? (
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="card !p-3 text-center">
                <p className="font-display text-lg font-extrabold text-foreground">{xp}</p>
                <p className="text-[11px] font-semibold text-secondary">XP · {level}</p>
              </div>
              <div className="card !p-3 text-center">
                <p className="font-display text-lg font-extrabold text-foreground">{streak}</p>
                <p className="text-[11px] font-semibold text-secondary">
                  jour{streak !== 1 ? 's' : ''} de suite
                </p>
              </div>
              <div className="card !p-3 text-center">
                <p className="font-display text-lg font-extrabold text-foreground">
                  {stats?.quizAnswered ?? 0}
                </p>
                <p className="text-[11px] font-semibold text-secondary">questions</p>
              </div>
            </div>
          ) : (
            <Link
              href="/auth/register"
              className="mt-4 flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50 p-4 transition-colors hover:border-primary-200"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
                <IconUserPlus size="1em" className="text-lg" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-bold text-foreground">
                  Crée ton compte gratuit
                </span>
                <span className="block text-xs text-secondary">
                  Pour sauvegarder ta progression et tes examens.
                </span>
              </span>
              <IconChevronRight size="1em" className="text-lg text-primary-400" aria-hidden="true" />
            </Link>
          )}

          {/* ── Revoir mes erreurs ── */}
          {errorCount > 0 && (
            <Link
              href="/quizz/erreurs"
              className="mt-3 flex items-center gap-3 rounded-2xl border border-token bg-surface-1 p-4 shadow-soft transition-transform active:scale-[0.98]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-danger-500">
                <IconTargetArrow size="1em" className="text-lg" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-bold text-foreground">
                  Revoir mes erreurs
                </span>
                <span className="block text-xs text-secondary">
                  {errorCount} question{errorCount > 1 ? 's' : ''} à retravailler
                </span>
              </span>
              <IconChevronRight size="1em" className="text-lg text-slate-300" aria-hidden="true" />
            </Link>
          )}

          {/* ── Quick access ── */}
          <p className="mb-3 mt-7 font-display text-base font-bold text-foreground">
            Continuer l&apos;apprentissage
          </p>
          <div className="grid grid-cols-2 gap-3">
            {TILES.map((t, i) => (
              <motion.div
                key={t.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={t.href}
                  className={`card flex h-full flex-col gap-2 border-2 !border-token ${t.ring} transition-colors`}
                >
                  <span
                    className={`chip ${t.accent} flex h-10 w-10 items-center justify-center !rounded-2xl`}
                  >
                    <t.icon size="1em" className="text-xl" aria-hidden="true" />
                  </span>
                  <span className="font-display text-sm font-bold text-foreground">{t.label}</span>
                  <span className="text-xs text-secondary">{t.desc}</span>
                </Link>
              </motion.div>
            ))}
          </div>

          <Link
            href="/cours"
            className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-token bg-surface-1 py-3.5 text-sm font-bold text-secondary shadow-soft transition-colors hover:text-foreground"
          >
            <IconBook2 size="1em" className="text-lg" aria-hidden="true" />
            Voir tous les cours
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
