'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell, PageHeader } from '@/components/AppShell';
import { getErrors, removeError, type ErrorItem } from '@/lib/errorBank';
import { shuffle } from '../config';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function ErrorReviewPage() {
  const [pool, setPool] = useState<ErrorItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [fixed, setFixed] = useState(0);
  const [opts, setOpts] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setPool(shuffle(getErrors()));
    setLoaded(true);
  }, []);

  const q = pool[index];

  useEffect(() => {
    if (q) setOpts(shuffle(q.options));
  }, [q]);

  const isCorrect = confirmed && selected === q?.bonneReponse;

  const verify = () => {
    if (!selected || confirmed || !q) return;
    setConfirmed(true);
    if (selected === q.bonneReponse) {
      setFixed((f) => f + 1);
      removeError(q.id);
    }
  };

  const next = () => {
    setSelected(null);
    setConfirmed(false);
    if (index + 1 >= pool.length) setDone(true);
    else setIndex(index + 1);
  };

  const restart = () => {
    setPool(shuffle(getErrors()));
    setIndex(0);
    setSelected(null);
    setConfirmed(false);
    setFixed(0);
    setDone(false);
  };

  const remaining = useMemo(() => pool.length - fixed, [pool.length, fixed]);

  return (
    <AppShell>
      <PageHeader
        title="Revoir mes erreurs"
        subtitle={
          pool.length > 0
            ? `${pool.length} question${pool.length > 1 ? 's' : ''} à corriger`
            : undefined
        }
        accent="violet"
        back="/quizz"
        compact
      />

      <div className="px-4 pb-8 pt-5">
        {/* Empty state */}
        {loaded && pool.length === 0 && (
          <div className="mt-12 text-center">
            <span className="text-5xl">🎉</span>
            <h2 className="mt-4 font-display text-lg font-bold text-foreground">
              Aucune erreur à revoir !
            </h2>
            <p className="mt-2 text-sm text-secondary">
              Les questions ratées en quiz apparaîtront ici pour que tu puisses les retravailler.
            </p>
            <Link href="/quizz" className="btn-primary mt-6 inline-flex">
              Faire un quiz
            </Link>
          </div>
        )}

        {/* Summary */}
        {done && pool.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-10 text-center"
          >
            <span className="text-5xl">{fixed === pool.length ? '🏆' : '💪'}</span>
            <h2 className="mt-4 font-display text-xl font-extrabold text-foreground">
              {fixed}/{pool.length} corrigée{fixed > 1 ? 's' : ''}
            </h2>
            <p className="mt-2 text-sm text-secondary">
              {fixed === pool.length
                ? 'Toutes tes erreurs sont corrigées. Bravo !'
                : `Encore ${remaining} question${remaining > 1 ? 's' : ''} à retravailler.`}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {fixed < pool.length && (
                <button onClick={restart} className="btn-primary">
                  Réessayer les restantes
                </button>
              )}
              <Link href="/quizz" className="btn-ghost">
                Retour aux quiz
              </Link>
            </div>
          </motion.div>
        )}

        {/* Player */}
        {!done && q && (
          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
            >
              {/* Progress */}
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    className="h-full rounded-full bg-violet-500"
                    animate={{ width: `${((index + (confirmed ? 1 : 0)) / pool.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-secondary">
                  {index + 1}/{pool.length}
                </span>
              </div>

              {/* Question */}
              <div className="rounded-2xl border border-token bg-surface-1 p-4 shadow-soft">
                {q.image && (
                  <div className="mb-3 flex h-48 items-center justify-center overflow-hidden rounded-2xl border border-token bg-surface-1 p-4">
                    <Image
                      src={q.image}
                      alt=""
                      width={192}
                      height={192}
                      unoptimized
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
                {!q.image && q.signalisation_visible && (
                  <div className="mb-3 flex items-center gap-3 rounded-2xl border border-token bg-surface-2 p-3">
                    <i className="ti ti-photo-question text-2xl text-violet-500" aria-hidden="true" />
                    <p className="text-sm font-medium text-secondary">{q.signalisation_visible}</p>
                  </div>
                )}
                <p className="text-sm font-semibold leading-relaxed text-foreground">{q.enonce}</p>
                <p className="mt-1.5 text-xs text-muted">{q.categorie}</p>
              </div>

              {/* Options */}
              <div className="mt-4 space-y-2.5">
                {opts.map((opt, i) => {
                  const chosen = selected === opt;
                  const good = confirmed && opt === q.bonneReponse;
                  const bad = confirmed && chosen && opt !== q.bonneReponse;
                  return (
                    <button
                      key={opt}
                      onClick={() => !confirmed && setSelected(opt)}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
                        good
                          ? 'border-success-500 bg-success-50 text-success-700'
                          : bad
                            ? 'border-red-400 bg-red-50 text-red-700'
                            : chosen
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-token bg-surface-1 text-foreground'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                          good
                            ? 'bg-success-500 text-white'
                            : bad
                              ? 'bg-red-400 text-white'
                              : chosen
                                ? 'bg-violet-500 text-white'
                                : 'bg-surface-2 text-secondary'
                        }`}
                      >
                        {LETTERS[i] ?? '•'}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {confirmed && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 rounded-2xl px-4 py-3 ${isCorrect ? 'bg-success-50' : 'bg-red-50'}`}
                >
                  <p
                    className={`text-sm font-bold ${isCorrect ? 'text-success-700' : 'text-red-700'}`}
                  >
                    {isCorrect ? '✅ Corrigée ! Elle quitte ta liste.' : '❌ Toujours pas…'}
                  </p>
                  {q.explication && (
                    <p className="mt-1 text-sm leading-snug text-secondary">{q.explication}</p>
                  )}
                </motion.div>
              )}

              {/* Action */}
              <button
                onClick={confirmed ? next : verify}
                disabled={!selected}
                className="btn-primary mt-5 w-full disabled:opacity-40"
              >
                {confirmed
                  ? index + 1 >= pool.length
                    ? 'Voir le bilan'
                    : 'Question suivante'
                  : 'Vérifier'}
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </AppShell>
  );
}
