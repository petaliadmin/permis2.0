'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
import { loadData } from '@/lib/dataSource';

interface Question {
  id: string;
  categorie: string;
  enonce: string;
  options: string[];
  bonneReponse: string;
  explication?: string;
}

type Phase = 'loading' | 'quiz' | 'done';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scoreColor(pct: number) {
  if (pct >= 70) return '#16A34A';
  if (pct >= 50) return '#F59E0B';
  return '#EF4444';
}

export default function TestsClient() {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [phase, setPhase] = useState<Phase>('loading');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadData<Question[]>('/questions/quiz', '/data/questions_doc.json')
      .then((d) => {
        setAllQuestions(Array.isArray(d) ? d : []);
      })
      .catch(console.error);
  }, []);

  const startQuiz = useCallback(() => {
    const shuffled = shuffle(allQuestions).slice(0, 20);
    setQuestions(shuffled);
    setIndex(0);
    setScore(0);
    setSelected(null);
    setPhase('quiz');
  }, [allQuestions]);

  // Auto-start once loaded
  useEffect(() => {
    if (allQuestions.length > 0 && phase === 'loading') startQuiz();
  }, [allQuestions, phase, startQuiz]);

  const q = questions[index];
  const total = questions.length;
  const confirmed = selected !== null;
  const isCorrect = selected === q?.bonneReponse;

  const confirm = (opt: string) => {
    if (confirmed) return;
    setSelected(opt);
    if (opt === q.bonneReponse) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= total) {
      setPhase('done');
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  /* ── Loading ── */
  if (phase === 'loading' || !q) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  /* ── Results ── */
  if (phase === 'done') {
    const pct = Math.round((score / total) * 100);
    const passed = pct >= 70;
    const color = scoreColor(pct);
    return (
      <AppShell>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-6 py-8"
        >
          {/* Score ring */}
          <div className="relative flex h-36 w-36 items-center justify-center">
            <svg
              viewBox="0 0 120 120"
              className="absolute inset-0 -rotate-90"
              width="144"
              height="144"
            >
              <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="10" />
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - pct / 100) }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="text-center">
              <p className="text-3xl font-extrabold" style={{ color }}>
                {pct}%
              </p>
              <p className="text-xs font-semibold text-slate-400">
                {score}/{total}
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-2xl font-extrabold text-foreground">
              {passed ? '🎉 Bravo !' : '😓 Pas encore'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {passed ? 'Tu dépasses le seuil de 70%.' : "Continue à t'entraîner !"}
            </p>
          </div>

          <button
            onClick={startQuiz}
            className="w-full max-w-xs rounded-2xl bg-primary-500 py-3.5 text-sm font-bold text-white shadow-glow transition-transform active:scale-95"
          >
            Recommencer
          </button>
        </motion.div>
      </AppShell>
    );
  }

  /* ── Quiz ── */
  return (
    <AppShell>
      {/* Progress */}
      <div className="mb-5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-full rounded-full bg-primary-500"
            animate={{ width: `${((index + 1) / total) * 100}%` }}
            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
          />
        </div>
        <span className="shrink-0 text-xs font-bold text-slate-400">
          {index + 1}/{total}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.25 }}
        >
          {/* Category badge */}
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {q.categorie}
          </p>

          {/* Question */}
          <p className="mb-6 text-base font-bold leading-snug text-foreground">{q.enonce}</p>

          {/* Options */}
          <div className="space-y-2.5">
            {q.options.map((opt) => {
              const isSelected = selected === opt;
              const correct = q.bonneReponse === opt;

              let bg = 'bg-surface-2';
              let border = 'border-token';
              let text = 'text-foreground';
              let indicator = 'bg-surface-3 text-muted';

              if (confirmed) {
                if (correct) {
                  bg = 'bg-green-500/12';
                  border = 'border-green-500/50';
                  text = 'text-green-300 font-semibold';
                  indicator = 'bg-green-500 text-white';
                } else if (isSelected) {
                  bg = 'bg-red-500/12';
                  border = 'border-red-500/50';
                  text = 'text-red-300';
                  indicator = 'bg-red-500 text-white';
                }
              } else if (isSelected) {
                bg = 'bg-primary-500/15';
                border = 'border-primary-500';
                text = 'text-primary-300 font-semibold';
                indicator = 'bg-primary-500 text-white';
              }

              return (
                <motion.button
                  key={opt}
                  whileTap={confirmed ? {} : { scale: 0.98 }}
                  onClick={() => confirm(opt)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${bg} ${border}`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${indicator}`}
                  >
                    {confirmed && correct ? '✓' : confirmed && isSelected ? '✗' : ''}
                  </span>
                  <span className={`text-sm leading-snug ${text}`}>{opt}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Explication + Suivant */}
          <AnimatePresence>
            {confirmed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.28 }}
                className="mt-5 space-y-3"
              >
                {q.explication && (
                  <p
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isCorrect
                        ? 'bg-green-500/10 border border-green-500/25 text-green-300'
                        : 'bg-red-500/10 border border-red-500/25 text-red-300'
                    }`}
                  >
                    {q.explication}
                  </p>
                )}
                <button
                  onClick={next}
                  className="w-full rounded-2xl bg-primary-500 py-3.5 text-sm font-bold text-white shadow-glow transition-transform active:scale-95"
                >
                  {index + 1 < total ? 'Question suivante →' : 'Voir le résultat 🏁'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
