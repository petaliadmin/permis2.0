'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
import { useAuthStore } from '@/store/authStore';
import { usePurchasesStore } from '@/store/purchasesStore';

const FREE_UP_TO = 5;

interface DiapoQuestion { q: number; image: string; answer: string[]; }
interface DiapoExam { id: number; title: string; questions: DiapoQuestion[]; }

const OPTIONS = ['A', 'B', 'C', 'D'] as const;

function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
function answersMatch(selected: string[], correct: string[]) {
  if (selected.length !== correct.length) return false;
  return correct.every((l) => selected.includes(l));
}

export default function DiapoExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasKey = usePurchasesStore((s) => s.hasKey);
  const fetchEntitlements = usePurchasesStore((s) => s.fetchEntitlements);

  const [exam, setExam] = useState<DiapoExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string[]>>({});
  const [confirmed, setConfirmed] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { if (isAuthenticated) fetchEntitlements(); }, [isAuthenticated, fetchEntitlements]);

  useEffect(() => {
    if (loading) return;
    const hasAccess = Number(id) <= FREE_UP_TO || hasKey('pack_exams');
    if (!hasAccess) router.replace(isAuthenticated ? '/boutique' : '/auth/login');
  }, [loading, id, isAuthenticated, hasKey, router]);

  useEffect(() => {
    fetch('/data/diapos.json').then((r) => r.json()).then((d) => {
      setExam(d.exams.find((e: DiapoExam) => e.id === Number(id)) ?? null);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  // Count-up timer while taking the exam.
  useEffect(() => {
    if (!exam || finished) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [exam, finished]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }
  if (!exam) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <i className="ti ti-mood-sad text-4xl text-slate-400" aria-hidden="true" />
          <p className="font-bold text-foreground">Examen introuvable</p>
          <button onClick={() => router.push('/exam')} className="btn-orange">Retour aux examens</button>
        </div>
      </AppShell>
    );
  }

  const q = exam.questions[currentQ];
  const total = exam.questions.length;
  const selected = userAnswers[q.q] ?? [];
  const isConfirmed = confirmed[q.q] ?? false;

  const toggleOption = (letter: string) => {
    if (isConfirmed) return;
    setUserAnswers((prev) => {
      const cur = prev[q.q] ?? [];
      const next = cur.includes(letter) ? cur.filter((l) => l !== letter) : [...cur, letter];
      return { ...prev, [q.q]: next };
    });
  };
  const confirm = () => setConfirmed((prev) => ({ ...prev, [q.q]: true }));
  const goNext = () => { if (currentQ < total - 1) setCurrentQ((n) => n + 1); else setFinished(true); };
  const goPrev = () => { if (currentQ > 0) setCurrentQ((n) => n - 1); };

  /* ── Result (dark, medal) ── */
  if (finished) {
    const score = exam.questions.filter((qst) => answersMatch(userAnswers[qst.q] ?? [], qst.answer)).length;
    const pct = Math.round((score / total) * 100);
    const passed = pct >= 70;
    const r = 54, circ = 2 * Math.PI * r;
    const color = passed ? '#F59E0B' : '#EF4444';

    return (
      <div className="on-ink flex min-h-screen flex-col bg-ink px-5 pt-[calc(env(safe-area-inset-top)+28px)] pb-8 text-center">
        <h1 className="font-display text-lg font-bold text-white">Examen terminé</h1>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="mt-8 flex flex-col items-center">
          <div className="relative h-44 w-44">
            <svg viewBox="0 0 140 140" width="176" height="176" className="-rotate-90">
              <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
              <motion.circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: circ * (1 - pct / 100) }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${passed ? 'bg-orange-500' : 'bg-danger-500'} shadow-lg`}>
                <i className="ti ti-medal text-3xl text-white" aria-hidden="true" />
              </div>
              <p className="mt-2 font-display text-2xl font-black text-white">{score}/{total}</p>
              <p className="text-sm font-bold" style={{ color }}>{pct}%</p>
            </div>
          </div>

          <p className={`mt-6 font-display text-xl font-black ${passed ? 'text-orange-400' : 'text-danger-400'}`}>
            Résultat : {passed ? 'Réussi' : 'Échoué'}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {passed ? 'Bon travail ! Continuez comme ça.' : `Il faut ≥ 70 % (${Math.ceil(total * 0.7)} bonnes réponses).`}
          </p>
          <p className="mt-2 text-xs text-slate-500">Temps total : {fmt(elapsed)}</p>
        </motion.div>

        {/* Answer review grid */}
        <div className="mt-8 w-full text-left">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Corrigé</p>
          <div className="grid grid-cols-6 gap-2">
            {exam.questions.map((qst) => {
              const ok = answersMatch(userAnswers[qst.q] ?? [], qst.answer);
              const skipped = !confirmed[qst.q];
              return (
                <div key={qst.q} title={`Q${qst.q} — ${qst.answer.join('')}`}
                  className="flex h-11 flex-col items-center justify-center rounded-xl text-[10px] font-bold"
                  style={{ backgroundColor: skipped ? 'rgba(255,255,255,0.05)' : ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: skipped ? '#64748b' : ok ? '#4ade80' : '#f87171' }}>
                  <span>{qst.q}</span>
                  <span>{skipped ? '—' : ok ? '✓' : '✗'}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto space-y-3 pt-8">
          <button onClick={() => { setUserAnswers({}); setConfirmed({}); setCurrentQ(0); setElapsed(0); setFinished(false); }}
            className="btn-orange w-full">Recommencer</button>
          <button onClick={() => router.push('/exam')}
            className="w-full rounded-full border border-white/15 py-3.5 text-sm font-bold text-slate-300">
            Retour aux examens
          </button>
        </div>
      </div>
    );
  }

  /* ── Exam question (light, orange) ── */
  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <header className="sticky top-0 z-20 bg-surface/95 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 backdrop-blur-xl">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/exam')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-secondary" aria-label="Quitter">
              <i className="ti ti-x text-lg" aria-hidden="true" />
            </button>
            <p className="flex-1 truncate text-sm font-bold text-foreground">{exam.title}</p>
            <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-black text-orange-600 tabular-nums">
              <i className="ti ti-clock" aria-hidden="true" />{fmt(elapsed)}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600"
                animate={{ width: `${((currentQ + 1) / total) * 100}%` }} transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.3 }} />
            </div>
            <span className="shrink-0 text-xs font-bold text-secondary tabular-nums">{currentQ + 1}/{total}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div key={q.q} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.28 }} className="overflow-hidden rounded-2xl border border-token bg-surface-1 shadow-soft">
            <Image src={`/data/diapos/${q.image}`} alt={`Question ${q.q}`} width={800} height={600}
              className="h-auto w-full object-contain" priority unoptimized />
          </motion.div>
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map((letter) => {
            const isSel = selected.includes(letter);
            const isCorrect = q.answer.includes(letter);
            let cls = 'border-token bg-surface-1 text-foreground';
            let badge = 'bg-surface-2 text-secondary';
            if (isConfirmed) {
              if (isCorrect) { cls = 'border-success-500 bg-success-50 text-success-700'; badge = 'bg-success-600 text-white'; }
              else if (isSel) { cls = 'border-danger-500 bg-red-50 text-danger-600'; badge = 'bg-danger-500 text-white'; }
            } else if (isSel) { cls = 'border-orange-500 bg-orange-50 text-orange-700 font-bold'; badge = 'bg-orange-500 text-white'; }
            return (
              <motion.button key={letter} whileTap={isConfirmed ? {} : { scale: 0.96 }} onClick={() => toggleOption(letter)}
                className={`flex h-14 items-center justify-center gap-2 rounded-2xl border-2 text-base font-bold shadow-soft transition-colors ${cls}`}>
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${badge}`}>{letter}</span>
                {isConfirmed && isCorrect && <i className="ti ti-check text-success-600" aria-hidden="true" />}
                {isConfirmed && isSel && !isCorrect && <i className="ti ti-x text-danger-500" aria-hidden="true" />}
              </motion.button>
            );
          })}
        </div>

        {isConfirmed && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold ${answersMatch(selected, q.answer) ? 'bg-success-50 text-success-700' : 'bg-red-50 text-danger-600'}`}>
            {answersMatch(selected, q.answer) ? `✓ Correct — réponse : ${q.answer.join(', ')}` : `✗ Bonne réponse : ${q.answer.join(', ')}`}
          </motion.div>
        )}
      </div>

      <div className="bg-surface px-4 pb-8 pt-4">
        <div className="mx-auto flex max-w-lg gap-3">
          {currentQ > 0 && (
            <button onClick={goPrev} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-token text-secondary" aria-label="Précédent">
              <i className="ti ti-chevron-left text-lg" aria-hidden="true" />
            </button>
          )}
          <button className="btn-ghost shrink-0"><i className="ti ti-flag" aria-hidden="true" /> Signaler</button>
          {!isConfirmed ? (
            <button onClick={confirm} disabled={selected.length === 0} className="btn-orange flex-1 disabled:opacity-40">Confirmer</button>
          ) : (
            <button onClick={goNext} className="btn-orange flex-1">{currentQ < total - 1 ? 'Suivante' : 'Résultats 🏁'}</button>
          )}
        </div>
      </div>
    </div>
  );
}
