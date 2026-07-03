'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCategoryBySlug, getQuizById, FREE_QUESTIONS } from '../../config';

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ─── Result (light, gauge) ──────────────────────────────────────────────────── */
function ResultScreen({ score, total, wrong, xp, time, onRetry }: {
  score: number; total: number; wrong: number; xp: number; time: number; onRetry: () => void;
}) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = pct >= 60;
  const color = pct >= 80 ? '#16A34A' : pct >= 60 ? '#F59E0B' : '#EF4444';
  const r = 54, circ = 2 * Math.PI * r;

  return (
    <div className="flex min-h-screen flex-col bg-surface px-5 pt-[calc(env(safe-area-inset-top)+24px)] pb-8">
      <h1 className="text-center font-display text-lg font-bold text-foreground">Résultat</h1>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="mt-6 flex flex-col items-center">
        <div className="relative h-40 w-40">
          <svg viewBox="0 0 140 140" width="160" height="160" className="-rotate-90">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
            <motion.circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-display text-3xl font-black text-foreground">{score}/{total}</p>
            <p className="text-sm font-bold" style={{ color }}>{pct}%</p>
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

      <div className={`mt-5 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 ${passed ? 'bg-success-50 text-success-700' : 'bg-orange-50 text-orange-600'}`}>
        <span className="text-lg">{passed ? '🎉' : '💪'}</span>
        <p className="text-sm font-bold">{passed ? 'Bravo ! Vous avez réussi' : 'Continuez, vous y êtes presque !'}</p>
      </div>

      <p className="mt-4 text-center font-display text-base font-bold text-violet-600">+{xp} XP ⭐</p>

      <div className="mt-auto space-y-3 pt-6">
        <button onClick={onRetry} className="btn-violet w-full">🔄 Recommencer</button>
        <Link href="/quizz" className="btn-ghost w-full">Changer de catégorie</Link>
        <Link href="/" className="block py-1 text-center text-sm text-muted transition-colors hover:text-secondary">
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}

function GameOverScreen({ score, xp, onRetry }: { score: number; xp: number; onRetry: () => void }) {
  return (
    <div className="on-ink flex min-h-screen flex-col items-center justify-center bg-ink p-6 text-center">
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}>
        <div className="text-7xl">💔</div>
        <h2 className="mt-5 font-display text-2xl font-black text-white">Partie terminée</h2>
        <p className="mt-1 text-sm text-slate-400">Tu n’as plus de vies.</p>
        <div className="mt-6 flex justify-center gap-10">
          <div><p className="font-display text-2xl font-black text-violet-400">+{xp}</p><p className="text-xs text-slate-500">XP</p></div>
          <div><p className="font-display text-2xl font-black text-white">{score}</p><p className="text-xs text-slate-500">bonnes</p></div>
        </div>
        <div className="mt-8 space-y-3">
          <button onClick={onRetry} className="btn-violet w-full">Réessayer</button>
          <Link href="/quizz" className="block py-2 text-sm text-slate-400">← Retour aux quiz</Link>
        </div>
      </motion.div>
    </div>
  );
}

function PaywallScreen({ quizTitle }: { quizTitle: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex-1 px-6 pt-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-3xl">🔒</div>
        <h2 className="mt-5 font-display text-2xl font-black text-foreground">Continue ton apprentissage</h2>
        <p className="mt-2 text-sm text-secondary">
          Tu as utilisé tes {FREE_QUESTIONS} questions gratuites sur <span className="font-semibold text-foreground">{quizTitle}</span>
        </p>
        <div className="mx-auto mt-8 max-w-xs space-y-3 text-left">
          {['Accès illimité à toutes les questions','14 quiz complets débloqués','Explications détaillées','Mode examen officiel inclus'].map((b) => (
            <div key={b} className="flex items-center gap-2.5">
              <i className="ti ti-circle-check-filled text-success-500" aria-hidden="true" />
              <p className="text-sm text-secondary">{b}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3 px-6 pb-10 pt-5">
        <Link href="/boutique" className="btn-violet w-full">🚀 Débloquer — 2 500 FCFA/mois</Link>
        <p className="text-center text-xs text-muted">Sans engagement · Annulation facile</p>
        <Link href="/quizz" className="block py-2 text-center text-sm text-muted">Peut-être plus tard →</Link>
      </div>
    </div>
  );
}

/* ─── Feedback overlay (dark celebration) ────────────────────────────────────── */
function FeedbackOverlay({ correct, explication, answer, onNext }: {
  correct: boolean; explication?: string; answer: string; onNext: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="on-ink fixed inset-0 z-50 flex flex-col bg-ink px-6 pt-[calc(env(safe-area-inset-top)+40px)] pb-8 text-center">
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className={`font-display text-2xl font-black ${correct ? 'text-success-400' : 'text-danger-400'}`}>
          {correct ? 'Bonne réponse ! 🎉' : 'Pas tout à fait'}
        </p>
        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className={`mt-8 flex h-32 w-32 items-center justify-center rounded-full ${correct ? 'bg-success-500' : 'bg-danger-500'}`}>
          <i className={`ti ${correct ? 'ti-check' : 'ti-x'} text-6xl text-white`} aria-hidden="true" />
        </motion.div>

        <div className="mt-10 w-full max-w-sm rounded-2xl bg-white/5 p-4 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Explication</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
            {explication ?? (correct ? 'Bien vu, tu maîtrises cette règle.' : `La bonne réponse était : « ${answer} »`)}
          </p>
        </div>
      </div>
      <button onClick={onNext} className="btn-violet w-full max-w-sm mx-auto">Question suivante</button>
    </motion.div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export default function QuizPlayerPage() {
  const params = useParams<{ slug: string; quizId: string }>();
  const { slug, quizId } = params;

  const category = getCategoryBySlug(slug);
  const quizConfig = category ? getQuizById(category, quizId) : undefined;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [phase, setPhase] = useState<'loading' | 'quiz' | 'paywall' | 'done' | 'gameover'>('loading');
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

  useEffect(() => {
    if (!quizConfig) return;
    fetch('/data/questions_doc.json').then((r) => r.json()).then((data) => {
      const all: Question[] = Array.isArray(data) ? data : (data.questions ?? []);
      setQuestions(all.filter((q) => q.categorie === quizConfig.categoryKey));
      setPhase('quiz');
      startRef.current = Date.now();
    }).catch(() => setPhase('loading'));
  }, [quizConfig]);

  useEffect(() => {
    const q = questions[index];
    if (!q) return;
    setOpts(shuffle(q.options));
    setImgLoaded(false);
    setImgError(false);
  }, [index, questions]);

  const q = questions[index];
  const displayTotal = Math.min(questions.length, FREE_QUESTIONS);
  const isCorrect = confirmed && selected === q?.bonneReponse;

  const handleVerify = () => {
    if (!selected || confirmed || !q) return;
    setConfirmed(true);
    if (selected === q.bonneReponse) { setScore((s) => s + 1); setXp((x) => x + 10); }
    else { setWrong((w) => w + 1); setHearts((h) => Math.max(0, h - 1)); }
  };

  const handleNext = () => {
    setElapsed(Math.round((Date.now() - startRef.current) / 1000));
    if (heartsRef.current <= 0) { setPhase('gameover'); return; }
    const next = index + 1;
    if (next >= questions.length) {
      try {
        const prog = JSON.parse(localStorage.getItem('quizz_progress') ?? '{}');
        prog[`${slug}_${quizId}`] = true;
        localStorage.setItem('quizz_progress', JSON.stringify(prog));
      } catch {}
      setPhase('done'); return;
    }
    if (next >= FREE_QUESTIONS) { setPhase('paywall'); return; }
    setIndex(next); setSelected(null); setConfirmed(false);
  };

  const resetGame = () => {
    setIndex(0); setScore(0); setWrong(0); setXp(0); setHearts(HEARTS_MAX);
    setSelected(null); setConfirmed(false); setPhase('quiz'); startRef.current = Date.now();
  };

  if (!category || !quizConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-secondary">Quiz introuvable. <Link href="/quizz" className="text-violet-600 underline">Retour</Link></p>
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
  if (phase === 'done') return <ResultScreen score={score} total={displayTotal} wrong={wrong} xp={xp} time={elapsed} onRetry={resetGame} />;
  if (phase === 'paywall') return <PaywallScreen quizTitle={quizConfig.title} />;

  /* ── Quiz question (light, violet) ── */
  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <header className="sticky top-0 z-20 bg-surface/95 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link href="/quizz" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-secondary" aria-label="Fermer">
            <i className="ti ti-x text-lg" aria-hidden="true" />
          </Link>
          <span className="shrink-0 text-xs font-bold text-secondary tabular-nums">
            {index + 1} / {displayTotal}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600"
              animate={{ width: `${((index + (confirmed ? 1 : 0)) / displayTotal) * 100}%` }}
              transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.4 }} />
          </div>
          <div className="flex shrink-0 gap-0.5">
            {Array.from({ length: HEARTS_MAX }).map((_, i) => (
              <i key={i} className={`ti ti-heart-filled text-sm ${i < hearts ? 'text-danger-500' : 'text-slate-300'}`} aria-hidden="true" />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.24 }} className="mx-auto max-w-lg px-5 pb-4 pt-4">

            {q.image && !imgError && (
              <div className="mb-6 overflow-hidden rounded-2xl border border-token bg-surface-1">
                {!imgLoaded && (
                  <div className="flex h-44 items-center justify-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={q.image.replace('/images/quiz/', '/data/diapos/')} alt="Illustration"
                  onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)}
                  className={`mx-auto block max-h-56 w-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'h-0 opacity-0'}`} />
              </div>
            )}

            <p className="mb-6 font-display text-lg font-bold leading-snug text-foreground">{q.enonce}</p>

            <div className="space-y-3">
              {opts.map((opt, i) => {
                const isSel = selected === opt;
                let cls = 'border-token bg-surface-1 text-foreground';
                let badge = 'bg-surface-2 text-secondary';
                if (isSel) { cls = 'border-violet-500 bg-violet-50 text-violet-700 font-semibold'; badge = 'bg-violet-600 text-white'; }
                return (
                  <motion.button key={opt} whileTap={{ scale: 0.99 }} onClick={() => setSelected(opt)}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-sm leading-snug shadow-soft transition-colors ${cls}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${badge}`}>{LETTERS[i]}</span>
                    <span className="flex-1">{opt}</span>
                    {isSel && <i className="ti ti-circle-check-filled text-violet-600" aria-hidden="true" />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="bg-surface px-5 pb-8 pt-4">
        <div className="mx-auto max-w-lg">
          <button onClick={handleVerify} disabled={!selected}
            className="btn-violet w-full disabled:opacity-40">Valider</button>
        </div>
      </div>

      <AnimatePresence>
        {confirmed && (
          <FeedbackOverlay correct={!!isCorrect} explication={q.explication} answer={q.bonneReponse} onNext={handleNext} />
        )}
      </AnimatePresence>
    </div>
  );
}
