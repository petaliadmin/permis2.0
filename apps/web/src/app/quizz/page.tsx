'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AppShell, PageHeader } from '@/components/AppShell';
import { useAuthStore } from '@/store/authStore';
import { usePurchasesStore } from '@/store/purchasesStore';
import { QUIZ_CATEGORIES, TOTAL_QUIZZES, FREE_SERIES_UP_TO, type SeriesProgress } from './config';
import { countErrors } from '@/lib/errorBank';

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} étoile${count !== 1 ? 's' : ''} sur 3`}>
      {[1, 2, 3].map((n) => (
        <i
          key={n}
          className={`ti ti-star-filled text-sm ${n <= count ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isPremium = usePurchasesStore((s) => s.hasKey('premium_all'));
  const currentStreak = user?.currentStreak ?? 0;
  const progress = useProgress();
  const category = QUIZ_CATEGORIES[0];

  const handleStart = (quizId: string) => {
    const unlocked = Number(quizId) <= FREE_SERIES_UP_TO || isPremium;
    if (!unlocked) {
      router.push(isAuthenticated ? '/boutique' : '/auth/login');
      return;
    }
    router.push(`/quizz/${category.slug}/${quizId}`);
  };
  // Only count series that still exist — ignore stale keys left over from a
  // previous quiz structure (e.g. localStorage entries from removed series).
  const completed = category.quizzes.filter(
    (qz) => progress[`${category.slug}_${qz.id}`]?.done
  ).length;
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

        <p className="mb-3 font-display text-base font-bold text-foreground">Choisir une série</p>
        <div className="space-y-3">
          {category.quizzes.map((quiz, i) => {
            const key = `${category.slug}_${quiz.id}`;
            const prog = progress[key] ?? { done: false, pct: 0, stars: 0 };
            const scoreColor = prog.pct >= 80 ? '#16A34A' : prog.pct >= 60 ? '#F59E0B' : '#EF4444';
            const isFree = Number(quiz.id) <= FREE_SERIES_UP_TO;
            const unlocked = isFree || isPremium;

            return (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <button
                  onClick={() => handleStart(quiz.id)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-token bg-surface-1 p-4 text-left shadow-soft transition-transform active:scale-[0.98]"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-2xl">
                    {unlocked ? quiz.emoji : <i className="ti ti-lock text-xl text-slate-400" aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-display text-sm font-bold text-foreground">
                        {quiz.title}
                      </p>
                      {prog.done && (
                        <span className="rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-bold text-success-600">
                          ✓ Complété
                        </span>
                      )}
                      {!unlocked && <span className="chip chip-orange">Premium</span>}
                      {unlocked && !isFree && (
                        <span className="chip chip-primary">Débloqué</span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <Stars count={prog.stars} />
                      <span className="text-[11px] text-muted">
                        {prog.done ? `${prog.pct}%` : `${quiz.questionsPerSession} questions`}
                      </span>
                    </div>
                    {prog.done && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: scoreColor }}
                          initial={{ width: 0 }}
                          animate={{ width: `${prog.pct}%` }}
                          transition={{
                            duration: 0.6,
                            delay: i * 0.06 + 0.3,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <i className="ti ti-chevron-right text-lg text-slate-300" aria-hidden="true" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
