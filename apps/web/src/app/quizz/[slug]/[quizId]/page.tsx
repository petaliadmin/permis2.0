'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sheet } from '@permis2.0/ui';
import {
  getCategoryBySlug,
  getQuizById,
  FREE_QUESTIONS,
  TOTAL_QUIZZES,
  buildSessionQuestions,
  calcStars,
  shuffle,
} from '../../config';
import { SUBSCRIPTION_PRICE_ANNUAL } from '@permis2.0/shared';
import { usePurchasesStore } from '@/store/purchasesStore';
import { useSettingsStore } from '@/store/settingsStore';
import { addError, removeError } from '@/lib/errorBank';
import { loadData } from '@/lib/dataSource';

interface Question {
  id: string;
  categorie: string;
  enonce: string;
  options: string[];
  bonneReponse: string;
  explication?: string;
  image?: string;
}

const HEARTS_MAX = 3;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/* ─── Sounds (Web Audio API, no external file) ───────────────────────────────── */
function playSuccessSound() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [523.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch {}
}

function playFailureSound() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    // Two descending notes — low, harsh buzz
    [330, 220].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  } catch {}
}

/* ─── Confetti / petal burst ─────────────────────────────────────────────────── */
const BURST_COLORS = [
  '#f43f5e',
  '#fb923c',
  '#fbbf24',
  '#a3e635',
  '#34d399',
  '#38bdf8',
  '#a78bfa',
  '#f472b6',
  '#ffffff',
];

type Particle = {
  id: number;
  x: number;
  vy: number;
  vx: number;
  color: string;
  isCircle: boolean;
  w: number;
  h: number;
  rotate: number;
  delay: number;
};

function genParticles(n: number): Particle[] {
  return Array.from({ length: n }, (_, i) => {
    const isCircle = Math.random() > 0.42;
    const base = 5 + Math.random() * 9;
    return {
      id: i,
      x: 15 + Math.random() * 70,
      vy: -(55 + Math.random() * 130),
      vx: (Math.random() - 0.5) * 200,
      color: BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)],
      isCircle,
      w: isCircle ? base : base * 0.55,
      h: isCircle ? base : base * 1.7,
      rotate: Math.random() * 720 - 360,
      delay: Math.random() * 0.22,
    };
  });
}

function SuccessBurst({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (active) setParticles(genParticles(60));
    else setParticles([]);
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: '38%',
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? '50%' : '2px',
          }}
          initial={{ opacity: 0.95, y: 0, x: 0, rotate: 0 }}
          animate={{ opacity: 0, y: p.vy, x: p.vx, rotate: p.rotate }}
          transition={{ duration: 1.4, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60),
    s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ─── Result screen ──────────────────────────────────────────────────────────── */
function ResultScreen({
  score,
  total,
  wrong,
  xp,
  time,
  slug,
  onRetry,
}: {
  score: number;
  total: number;
  wrong: number;
  xp: number;
  time: number;
  slug: string;
  onRetry: () => void;
}) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = pct >= 60;
  const color = pct >= 80 ? '#16A34A' : pct >= 60 ? '#F59E0B' : '#EF4444';
  const r = 54,
    circ = 2 * Math.PI * r;

  return (
    <div className="flex min-h-screen flex-col bg-surface px-5 pt-[calc(env(safe-area-inset-top)+24px)] pb-8">
      <h1 className="text-center font-display text-lg font-bold text-foreground">Résultat</h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 flex flex-col items-center"
      >
        <div className="relative h-40 w-40">
          <svg viewBox="0 0 140 140" width="160" height="160" className="-rotate-90">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
            <motion.circle
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-display text-3xl font-black text-foreground">
              {score}/{total}
            </p>
            <p className="text-sm font-bold" style={{ color }}>
              {pct}%
            </p>
          </div>
        </div>
      </motion.div>

      <div className="mt-7 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-token bg-surface-1 p-3 text-center shadow-soft">
          <p className="font-display text-xl font-black text-success-600">{score}</p>
          <p className="text-[11px] text-muted">Bonnes</p>
        </div>
        <div className="rounded-2xl border border-token bg-surface-1 p-3 text-center shadow-soft">
          <p className="font-display text-xl font-black text-danger-500">{wrong}</p>
          <p className="text-[11px] text-muted">Mauvaises</p>
        </div>
        <div className="rounded-2xl border border-token bg-surface-1 p-3 text-center shadow-soft">
          <p className="font-display text-xl font-black text-foreground">{fmt(time)}</p>
          <p className="text-[11px] text-muted">Temps</p>
        </div>
      </div>

      <div
        className={`mt-5 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 ${passed ? 'bg-success-50 text-success-700' : 'bg-orange-50 text-orange-600'}`}
      >
        <span className="text-lg">{passed ? '🎉' : '💪'}</span>
        <p className="text-sm font-bold">
          {passed ? 'Bravo ! Vous avez réussi' : 'Continuez, vous y êtes presque !'}
        </p>
      </div>

      <p className="mt-4 text-center font-display text-base font-bold text-violet-600">
        +{xp} XP ⭐
      </p>

      <div className="mt-auto space-y-3 pt-6">
        <button onClick={onRetry} className="btn-violet w-full">
          🔄 Recommencer
        </button>
        <Link href={`/quizz/${slug}`} className="btn-ghost w-full">
          Choisir une autre série
        </Link>
        <Link
          href="/"
          className="block py-1 text-center text-sm text-muted transition-colors hover:text-secondary"
        >
          Retour aux cours
        </Link>
      </div>
    </div>
  );
}

function GameOverScreen({
  score,
  xp,
  onRetry,
}: {
  score: number;
  xp: number;
  onRetry: () => void;
}) {
  return (
    <div className="on-ink flex min-h-screen flex-col items-center justify-center bg-ink p-6 text-center">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      >
        <div className="text-7xl">💔</div>
        <h2 className="mt-5 font-display text-2xl font-black text-white">Partie terminée</h2>
        <p className="mt-1 text-sm text-slate-400">Tu n&apos;as plus de vies.</p>
        <div className="mt-6 flex justify-center gap-10">
          <div>
            <p className="font-display text-2xl font-black text-violet-400">+{xp}</p>
            <p className="text-xs text-slate-500">XP</p>
          </div>
          <div>
            <p className="font-display text-2xl font-black text-white">{score}</p>
            <p className="text-xs text-slate-500">bonnes</p>
          </div>
        </div>
        <div className="mt-8 space-y-3">
          <button onClick={onRetry} className="btn-violet w-full">
            Réessayer
          </button>
          <Link href="/quizz" className="block py-2 text-sm text-slate-400">
            ← Retour aux quiz
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function PaywallScreen({ quizTitle }: { quizTitle: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex-1 px-6 pt-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-3xl">
          🔒
        </div>
        <h2 className="mt-5 font-display text-2xl font-black text-foreground">
          Continue ton apprentissage
        </h2>
        <p className="mt-2 text-sm text-secondary">
          Tu as utilisé tes {FREE_QUESTIONS} questions gratuites sur{' '}
          <span className="font-semibold text-foreground">{quizTitle}</span>
        </p>
        <div className="mx-auto mt-8 max-w-xs space-y-3 text-left">
          {[
            'Accès illimité à toutes les questions',
            `${TOTAL_QUIZZES} séries complètes débloquées`,
            'Explications détaillées',
            'Mode examen officiel inclus',
          ].map((b) => (
            <div key={b} className="flex items-center gap-2.5">
              <i className="ti ti-circle-check-filled text-success-500" aria-hidden="true" />
              <p className="text-sm text-secondary">{b}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3 px-6 pb-10 pt-5">
        <Link href="/boutique" className="btn-violet w-full">
          🚀 Débloquer — {SUBSCRIPTION_PRICE_ANNUAL}
        </Link>
        <p className="text-center text-xs text-muted">Sans engagement · Annulation facile</p>
        <Link href="/quizz" className="block py-2 text-center text-sm text-muted">
          Peut-être plus tard →
        </Link>
      </div>
    </div>
  );
}

/* ─── Feedback bottom sheet ──────────────────────────────────────────────────── */
function FeedbackSheet({
  open,
  correct,
  explication,
  answer,
  onNext,
}: {
  open: boolean;
  correct: boolean;
  explication?: string;
  answer: string;
  onNext: () => void;
}) {
  return (
    <Sheet open={open} onClose={onNext} ariaLabel="Résultat de la réponse">
      <div className="space-y-4">
        {/* Result badge */}
        <div
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${correct ? 'bg-success-50' : 'bg-red-50'}`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${correct ? 'bg-success-500' : 'bg-danger-500'}`}
          >
            <i
              className={`ti ${correct ? 'ti-check' : 'ti-x'} text-lg text-white`}
              aria-hidden="true"
            />
          </div>
          <div className="flex-1">
            <p
              className={`font-display text-base font-extrabold ${correct ? 'text-success-700' : 'text-danger-700'}`}
            >
              {correct ? 'Bonne réponse !' : 'Pas tout à fait…'}
            </p>
            {correct && <p className="text-xs font-semibold text-success-600">+10 XP</p>}
          </div>
          <span className="text-2xl" aria-hidden="true">
            {correct ? '🎉' : '😕'}
          </span>
        </div>

        {/* Explanation */}
        <div className="rounded-xl bg-surface-2 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Explication</p>
          <p className="mt-1.5 text-sm leading-relaxed text-secondary">
            {explication ??
              (correct
                ? 'Bien vu, tu maîtrises cette règle.'
                : `La bonne réponse était : « ${answer} »`)}
          </p>
        </div>

        {/* CTA — green when correct, red when wrong */}
        <button onClick={onNext} className={`w-full ${correct ? 'btn-success' : 'btn-danger'}`}>
          {correct ? '🚀 Question suivante' : '💪 Continuer quand même'}
        </button>
      </div>
    </Sheet>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export default function QuizPlayerPage() {
  const params = useParams<{ slug: string; quizId: string }>();
  const { slug, quizId } = params;

  const category = getCategoryBySlug(slug);
  const quizConfig = category ? getQuizById(category, quizId) : undefined;

  const isPremium = usePurchasesStore((s) => s.hasKey('premium_all'));
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [phase, setPhase] = useState<'loading' | 'quiz' | 'paywall' | 'done' | 'gameover'>(
    'loading'
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [hearts, setHearts] = useState(HEARTS_MAX);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [xp, setXp] = useState(0);
  const [opts, setOpts] = useState<string[]>([]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const heartsRef = useRef(hearts);
  heartsRef.current = hearts;
  const startRef = useRef(Date.now());
  const allQuestionsRef = useRef<Question[]>([]);

  useEffect(() => {
    if (!quizConfig) return;
    loadData<Question[]>(
      `/questions/quiz?categories=${encodeURIComponent(quizConfig.categoryKeys.join(','))}`,
      '/data/questions_doc.json'
    )
      .then((data) => {
        const all: Question[] = Array.isArray(data) ? data : [];
        allQuestionsRef.current = all;
        const session = buildSessionQuestions(
          all,
          quizConfig.categoryKeys,
          quizConfig.questionsPerSession
        );
        setQuestions(session);
        setPhase('quiz');
        startRef.current = Date.now();
      })
      .catch(() => setPhase('loading'));
  }, [quizConfig]);

  useEffect(() => {
    const q = questions[index];
    if (!q) return;
    setOpts(shuffle(q.options));
    setImgLoaded(false);
    setImgError(false);
  }, [index, questions]);

  const q = questions[index];
  const displayTotal = isPremium ? questions.length : Math.min(questions.length, FREE_QUESTIONS);
  const isCorrect = confirmed && selected === q?.bonneReponse;

  const handleVerify = () => {
    if (!selected || confirmed || !q) return;
    setConfirmed(true);
    if (selected === q.bonneReponse) {
      setScore((s) => s + 1);
      setXp((x) => x + 10);
      if (soundEnabled) playSuccessSound();
      removeError(q.id); // a corrected mistake leaves the review bank
    } else {
      setWrong((w) => w + 1);
      setHearts((h) => Math.max(0, h - 1));
      if (soundEnabled) playFailureSound();
      addError(q); // keep it for "Revoir mes erreurs"
    }
  };

  const handleNext = () => {
    setElapsed(Math.round((Date.now() - startRef.current) / 1000));
    if (heartsRef.current <= 0) {
      setPhase('gameover');
      return;
    }
    const next = index + 1;
    if (next >= questions.length) {
      const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
      try {
        const stored = JSON.parse(localStorage.getItem('quizz_progress') ?? '{}');
        const prev = stored[`${slug}_${quizId}`];
        // Keep best score
        const prevPct =
          prev && typeof prev === 'object' && 'pct' in prev ? (prev as { pct: number }).pct : 0;
        stored[`${slug}_${quizId}`] = {
          done: true,
          pct: Math.max(pct, prevPct),
          stars: calcStars(Math.max(pct, prevPct)),
        };
        localStorage.setItem('quizz_progress', JSON.stringify(stored));
      } catch {}
      // Fire-and-forget — don't block UX on this
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/gamification/record-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ correct: score, total: questions.length, mode: 'series' }),
      }).catch(() => {}); // silent fail — local progress already saved
      setPhase('done');
      return;
    }
    if (!isPremium && next >= FREE_QUESTIONS) {
      setPhase('paywall');
      return;
    }
    setIndex(next);
    setSelected(null);
    setConfirmed(false);
  };

  const resetGame = () => {
    // Reshuffle questions for a fresh session
    if (allQuestionsRef.current.length > 0 && quizConfig) {
      setQuestions(
        buildSessionQuestions(
          allQuestionsRef.current,
          quizConfig.categoryKeys,
          quizConfig.questionsPerSession
        )
      );
    }
    setIndex(0);
    setScore(0);
    setWrong(0);
    setXp(0);
    setHearts(HEARTS_MAX);
    setSelected(null);
    setConfirmed(false);
    setPhase('quiz');
    startRef.current = Date.now();
  };

  if (!category || !quizConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-secondary">
          Quiz introuvable.{' '}
          <Link href="/quizz" className="text-violet-600 underline">
            Retour
          </Link>
        </p>
      </div>
    );
  }
  if (phase === 'loading' || (phase === 'quiz' && !q)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }
  if (phase === 'gameover') return <GameOverScreen score={score} xp={xp} onRetry={resetGame} />;
  if (phase === 'done')
    return (
      <ResultScreen
        score={score}
        total={displayTotal}
        wrong={wrong}
        xp={xp}
        time={elapsed}
        slug={slug}
        onRetry={resetGame}
      />
    );
  if (phase === 'paywall') return <PaywallScreen quizTitle={quizConfig.title} />;

  /* ── Quiz question ── */
  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <header className="sticky top-0 z-20 bg-surface/95 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            href={`/quizz/${slug}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-secondary"
            aria-label="Fermer"
          >
            <i className="ti ti-x text-lg" aria-hidden="true" />
          </Link>
          <span className="shrink-0 text-xs font-bold text-secondary tabular-nums">
            {index + 1} / {displayTotal}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600"
              animate={{ width: `${((index + (confirmed ? 1 : 0)) / displayTotal) * 100}%` }}
              transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
            />
          </div>
          <div className="flex shrink-0 gap-0.5">
            {Array.from({ length: HEARTS_MAX }).map((_, i) => (
              <i
                key={i}
                className={`ti ti-heart-filled text-sm ${i < hearts ? 'text-danger-500' : 'text-slate-300'}`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.24 }}
            className="mx-auto max-w-lg px-5 pb-4 pt-4"
          >
            {q.image && !imgError && (
              <div className="mb-6 overflow-hidden rounded-2xl border border-token bg-surface-1">
                {!imgLoaded && (
                  <div className="flex h-44 items-center justify-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={q.image.replace('/images/quiz/', '/data/diapos/')}
                  alt="Illustration"
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgError(true)}
                  className={`mx-auto block max-h-56 w-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'h-0 opacity-0'}`}
                />
              </div>
            )}

            {/* Subcategory chip — shows which topic this question tests */}
            {quizConfig.categoryKeys.length > 1 && (
              <div className="mb-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                  <i className="ti ti-tag text-[10px]" aria-hidden="true" />
                  {q.categorie}
                </span>
              </div>
            )}
            <p className="mb-6 font-display text-lg font-bold leading-snug text-foreground">
              {q.enonce}
            </p>

            <div className="space-y-3">
              {opts.map((opt, i) => {
                const isSel = selected === opt;
                const isCorrectOpt = confirmed && opt === q.bonneReponse;
                const isWrongOpt = confirmed && isSel && opt !== q.bonneReponse;

                let cls = 'border-token bg-surface-1 text-foreground';
                let badge = 'bg-surface-2 text-secondary';

                if (isCorrectOpt) {
                  cls = 'border-success-500 bg-success-50 text-success-700 font-semibold';
                  badge = 'bg-success-500 text-white';
                } else if (isWrongOpt) {
                  cls = 'border-danger-500 bg-red-50 text-danger-700 font-semibold';
                  badge = 'bg-danger-500 text-white';
                } else if (isSel && !confirmed) {
                  cls = 'border-violet-500 bg-violet-50 text-violet-700 font-semibold';
                  badge = 'bg-violet-600 text-white';
                }

                return (
                  <motion.button
                    key={opt}
                    whileTap={{ scale: confirmed ? 1 : 0.99 }}
                    onClick={() => !confirmed && setSelected(opt)}
                    disabled={confirmed}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-sm leading-snug shadow-soft transition-colors ${cls}`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${badge}`}
                    >
                      {LETTERS[i]}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {isCorrectOpt && (
                      <i
                        className="ti ti-circle-check-filled text-success-600"
                        aria-hidden="true"
                      />
                    )}
                    {isWrongOpt && (
                      <i className="ti ti-circle-x-filled text-danger-500" aria-hidden="true" />
                    )}
                    {isSel && !confirmed && (
                      <i className="ti ti-circle-check-filled text-violet-600" aria-hidden="true" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Valider button — hidden while sheet is open */}
      <div className="bg-surface px-5 pb-8 pt-4">
        <div className="mx-auto max-w-lg">
          <button
            onClick={handleVerify}
            disabled={!selected || confirmed}
            className="btn-violet w-full disabled:opacity-40"
          >
            Valider
          </button>
        </div>
      </div>

      {/* Confetti burst on correct answer */}
      <SuccessBurst active={!!isCorrect} />

      {/* Feedback bottom sheet */}
      <FeedbackSheet
        open={confirmed}
        correct={!!isCorrect}
        explication={q?.explication}
        answer={q?.bonneReponse ?? ''}
        onNext={handleNext}
      />
    </div>
  );
}
