'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { useAuthStore } from '@/store/authStore';
import { usePurchasesStore } from '@/store/purchasesStore';
import { getCategoryBySlug, FREE_SERIES_UP_TO, type SeriesProgress } from '../config';

const CAT_STYLE: Record<
  string,
  { accent: 'blue' | 'violet' | 'orange'; color: string; icon: string }
> = {
  panneaux: { accent: 'orange', color: '#F97316', icon: 'ti-road-sign' },
  priorites: { accent: 'orange', color: '#F59E0B', icon: 'ti-arrows-cross' },
  circulation: { accent: 'blue', color: '#2563EB', icon: 'ti-car' },
  signaux: { accent: 'blue', color: '#16A34A', icon: 'ti-traffic-lights' },
  situations: { accent: 'orange', color: '#EF4444', icon: 'ti-alert-triangle' },
};

function readProgress(): Record<string, SeriesProgress> {
  try {
    const raw = JSON.parse(localStorage.getItem('quizz_progress') ?? '{}') as Record<
      string,
      unknown
    >;
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => {
        if (v === true) return [k, { done: true, pct: 100, stars: 3 }];
        if (v && typeof v === 'object' && 'done' in v) return [k, v as SeriesProgress];
        return [k, { done: false, pct: 0, stars: 0 }];
      })
    );
  } catch {
    return {};
  }
}

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

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const category = getCategoryBySlug(slug);
  const [progress, setProgress] = useState<Record<string, SeriesProgress>>({});
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isPremium = usePurchasesStore((s) => s.hasKey('premium_all'));

  useEffect(() => {
    setProgress(readProgress());
  }, []);

  const handleStart = (quizId: string) => {
    const unlocked = Number(quizId) <= FREE_SERIES_UP_TO || isPremium;
    if (!unlocked) {
      router.push(isAuthenticated ? '/boutique' : '/auth/login');
      return;
    }
    router.push(`/quizz/${slug}/${quizId}`);
  };

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-secondary">
          Catégorie introuvable.{' '}
          <Link href="/quizz" className="text-violet-600 underline">
            Retour
          </Link>
        </p>
      </div>
    );
  }

  const style = CAT_STYLE[slug] ?? {
    accent: 'violet' as const,
    color: '#7C3AED',
    icon: 'ti-cards',
  };
  const total = category.quizzes.length;
  const done = category.quizzes.filter((qz) => progress[`${slug}_${qz.id}`]?.done).length;

  return (
    <AppShell>
      <PageHeader
        title={category.title}
        accent={style.accent}
        back="/quizz"
        subtitle={category.description}
      />

      <div className="px-5 pt-6">
        {/* Category progress bar */}
        <div className="mb-6 rounded-2xl border border-token bg-surface-1 p-4 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary">Progression</span>
            <span className="text-xs font-black tabular-nums" style={{ color: style.color }}>
              {done}/{total} séries
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: style.color }}
              initial={{ width: 0 }}
              animate={{ width: `${total ? (done / total) * 100 : 0}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {/* Series list */}
        <div className="space-y-3">
          {category.quizzes.map((quiz, i) => {
            const key = `${slug}_${quiz.id}`;
            const prog = progress[key] ?? { done: false, pct: 0, stars: 0 };
            const isMaitrise = quiz.questionsPerSession === 0;
            const scoreColor = prog.pct >= 80 ? '#16A34A' : prog.pct >= 60 ? '#F59E0B' : '#EF4444';
            const isFree = Number(quiz.id) <= FREE_SERIES_UP_TO;
            const unlocked = isFree || isPremium;

            return (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <button
                  onClick={() => handleStart(quiz.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left shadow-soft transition-transform active:scale-[0.98] ${isMaitrise ? 'border-amber-200 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/20' : 'border-token bg-surface-1'}`}
                >
                  {/* Emoji badge */}
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${isMaitrise ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-surface-2'}`}
                  >
                    {unlocked ? (
                      quiz.emoji
                    ) : (
                      <i className="ti ti-lock text-xl text-slate-400" aria-hidden="true" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-display text-sm font-bold text-foreground">
                        {quiz.title}
                      </p>
                      {isMaitrise && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                          Maîtrise
                        </span>
                      )}
                      {prog.done && (
                        <span className="rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-bold text-success-600">
                          ✓ Complété
                        </span>
                      )}
                      {!unlocked && <span className="chip chip-orange">Premium</span>}
                    </div>

                    <div className="mt-1.5 flex items-center gap-3">
                      <Stars count={prog.stars} />
                      <span className="text-[11px] text-muted">
                        {prog.done
                          ? `${prog.pct}%`
                          : quiz.questionsPerSession === 0
                            ? 'Toutes les questions'
                            : `${quiz.questionsPerSession} questions`}
                      </span>
                    </div>

                    {/* Score progress bar (only when done) */}
                    {prog.done && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: scoreColor }}
                          initial={{ width: 0 }}
                          animate={{ width: `${prog.pct}%` }}
                          transition={{
                            duration: 0.6,
                            delay: i * 0.07 + 0.3,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <i
                    className="ti ti-chevron-right shrink-0 text-lg text-slate-300"
                    aria-hidden="true"
                  />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
