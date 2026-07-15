'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AppShell, PageHeader } from '@/components/AppShell';
import { useAuthStore } from '@/store/authStore';
import { QUIZ_CATEGORIES, TOTAL_QUIZZES, type SeriesProgress } from './config';
import { countErrors } from '@/lib/errorBank';

/* Per-category visual identity (icon + color) */
const CAT_STYLE: Record<string, { icon: string; color: string; soft: string }> = {
  panneaux: { icon: 'ti-road-sign', color: '#F97316', soft: 'bg-orange-50' },
  priorites: { icon: 'ti-arrows-cross', color: '#F59E0B', soft: 'bg-amber-50' },
  circulation: { icon: 'ti-car', color: '#2563EB', soft: 'bg-blue-50' },
  signaux: { icon: 'ti-traffic-lights', color: '#16A34A', soft: 'bg-green-50' },
  situations: { icon: 'ti-alert-triangle', color: '#EF4444', soft: 'bg-red-50' },
};

function useProgress() {
  const [progress, setProgress] = useState<Record<string, SeriesProgress>>({});
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('quizz_progress') ?? '{}') as Record<
        string,
        unknown
      >;
      const parsed: Record<string, SeriesProgress> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (v === true) parsed[k] = { done: true, pct: 100, stars: 3 };
        else if (v && typeof v === 'object' && 'done' in v) parsed[k] = v as SeriesProgress;
      }
      setProgress(parsed);
    } catch {}
  }, []);
  return progress;
}

export default function QuizzPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const currentStreak = user?.currentStreak ?? 0;
  const progress = useProgress();
  const completed = Object.values(progress).filter((p) => p?.done).length;
  const [errorCount, setErrorCount] = useState(0);
  useEffect(() => setErrorCount(countErrors()), []);

  return (
    <AppShell>
      <PageHeader
        title="Quiz"
        accent="violet"
        menu
        actions={
          <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
            <i className="ti ti-star-filled text-sm text-amber-300" aria-hidden="true" />
            <span className="text-sm font-black">{completed * 10}</span>
          </div>
        }
      >
        {/* Streak card */}
        <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-3.5 backdrop-blur-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-xl">
            🔥
          </div>
          <div className="flex-1">
            <p className="text-xs text-white/80">Série actuelle</p>
            <p className="font-display text-lg font-bold">
              {currentStreak} jour{currentStreak !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => router.push('/profil')}
            className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold"
          >
            Voir détails
          </button>
        </div>
      </PageHeader>

      <div className="px-5 pt-6">
        {/* Global progress */}
        <div className="mb-6 rounded-2xl border border-token bg-surface-1 p-4 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary">Progression globale</span>
            <span className="text-xs font-black text-violet-600">
              {completed}/{TOTAL_QUIZZES}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round((completed / TOTAL_QUIZZES) * 100)}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {/* Error review entry */}
        {errorCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              href="/quizz/erreurs"
              className="mb-6 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 p-4 text-white shadow-card transition-transform active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                <i className="ti ti-target-arrow text-2xl" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold">Revoir mes erreurs</p>
                <p className="text-xs text-white/85">
                  {errorCount} question{errorCount > 1 ? 's' : ''} à retravailler
                </p>
              </div>
              <i className="ti ti-chevron-right text-lg text-white/80" aria-hidden="true" />
            </Link>
          </motion.div>
        )}

        <p className="mb-3 font-display text-base font-bold text-foreground">
          Choisir une catégorie
        </p>
        <div className="space-y-3">
          {QUIZ_CATEGORIES.map((cat, i) => {
            const s = CAT_STYLE[cat.slug] ?? {
              icon: 'ti-cards',
              color: '#7C3AED',
              soft: 'bg-violet-50',
            };
            const done = cat.quizzes.filter((qz) => progress[`${cat.slug}_${qz.id}`]?.done).length;
            const total = cat.quizzes.length;
            const finished = done === total && total > 0;
            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link href={`/quizz/${cat.slug}`}>
                  <div className="flex items-center gap-4 rounded-2xl border border-token bg-surface-1 p-4 shadow-soft transition-transform active:scale-[0.98]">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${s.soft}`}
                    >
                      <i
                        className={`ti ${s.icon} text-2xl`}
                        style={{ color: s.color }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-display text-base font-bold text-foreground">
                          {cat.title}
                        </p>
                        {finished && <span className="chip chip-success">✓</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-secondary">{cat.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${total ? (done / total) * 100 : 0}%`,
                              backgroundColor: s.color,
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-bold tabular-nums text-muted">
                          {done}/{total}
                        </span>
                      </div>
                    </div>
                    <i className="ti ti-chevron-right text-lg text-slate-300" aria-hidden="true" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
