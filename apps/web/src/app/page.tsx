'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { TOTAL_QUIZZES } from './quizz/config';

/* ─── Onboarding ─────────────────────────────────────────────────────────────── */
const LEVELS = [
  { id: 'debutant',      label: 'Débutant',      desc: 'Je débute le Code de la route', icon: 'ti-seedling' },
  { id: 'intermediaire', label: 'Intermédiaire', desc: 'Je connais quelques règles',    icon: 'ti-car'      },
  { id: 'avance',        label: 'Avancé',        desc: 'Je veux juste réviser',         icon: 'ti-star'     },
];
const GOALS = [
  { id: '5',  label: '5 min / jour',  icon: 'ti-clock',  desc: '~5 questions par session'  },
  { id: '10', label: '10 min / jour', icon: 'ti-flame',  desc: '~10 questions par session' },
  { id: '20', label: '20 min / jour', icon: 'ti-rocket', desc: '~20 questions par session' },
];

function OnboardingScreen({ onComplete }: { onComplete: (name: string) => void }) {
  const [step,  setStep]  = useState(0);
  const [name,  setName]  = useState('');
  const [level, setLevel] = useState('');
  const [goal,  setGoal]  = useState('');

  const canNext = [name.trim().length > 0, level !== '', goal !== ''];
  const next = () => { if (step < 2) setStep((s) => s + 1); else onComplete(name.trim()); };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary-600 to-primary-800 px-5 py-10">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          <span className="font-display text-2xl font-black text-white">P</span>
        </div>
        <h1 className="font-display text-2xl font-black tracking-tight text-white">
          PERMIS<span className="text-primary-200">2.0</span>
        </h1>
        <p className="mt-1 text-xs text-white/70">La meilleure app permis au Sénégal</p>
      </motion.div>

      <div className="mb-8 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-white' : i < step ? 'w-4 bg-white/60' : 'w-4 bg-white/25'}`} />
        ))}
      </div>

      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <h2 className="mb-1 font-display text-xl font-bold text-white">Quel est ton prénom ?</h2>
              <p className="mb-5 text-sm text-white/70">Pour personnaliser ton expérience</p>
              <input
                autoFocus type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && name.trim() && next()}
                placeholder="Ex : Moussa"
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-sm text-white placeholder-white/50 transition-colors focus:border-white focus:outline-none"
              />
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <h2 className="mb-1 font-display text-xl font-bold text-white">Quel est ton niveau ?</h2>
              <p className="mb-5 text-sm text-white/70">On va adapter les exercices</p>
              <div className="space-y-2.5">
                {LEVELS.map((l) => (
                  <button key={l.id} onClick={() => setLevel(l.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${level === l.id ? 'border-white bg-white/20' : 'border-white/15 bg-white/5'}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                      <i className={`ti ${l.icon} text-base text-white`} aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{l.label}</p>
                      <p className="text-xs text-white/60">{l.desc}</p>
                    </div>
                    {level === l.id && <i className="ti ti-check text-sm text-white" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <h2 className="mb-1 font-display text-xl font-bold text-white">Ton objectif quotidien</h2>
              <p className="mb-5 text-sm text-white/70">La régularité fait la différence</p>
              <div className="space-y-2.5">
                {GOALS.map((g) => (
                  <button key={g.id} onClick={() => setGoal(g.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${goal === g.id ? 'border-white bg-white/20' : 'border-white/15 bg-white/5'}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                      <i className={`ti ${g.icon} text-base text-white`} aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{g.label}</p>
                      <p className="text-xs text-white/60">{g.desc}</p>
                    </div>
                    {goal === g.id && <i className="ti ti-check text-sm text-white" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <button onClick={next} disabled={!canNext[step]}
            className="w-full rounded-full bg-white py-3.5 text-sm font-black text-primary-700 shadow-lg transition-all active:scale-95 disabled:opacity-40">
            {step < 2 ? 'Continuer →' : '🚀 Commencer maintenant'}
          </button>
          {step === 0 && (
            <button onClick={() => onComplete('Conducteur')} className="mt-2 w-full py-2 text-center text-xs text-white/60 transition-colors hover:text-white">
              Passer cette étape
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Circular progress ─────────────────────────────────────────────────────── */
function ProgressRing({ value, size = 68, stroke = 7 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fff" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - dash }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/* ─── Dashboard ─────────────────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { href: '/traffic-signs', label: 'Panneaux',   desc: 'Apprends tous les panneaux',   icon: 'ti-road-sign',      grad: 'from-primary-500 to-primary-700' },
  { href: '/quizz',         label: 'Quiz',        desc: 'Teste tes connaissances',      icon: 'ti-cards',          grad: 'from-success-500 to-success-700' },
  { href: '/exam',          label: 'Examens',     desc: "Entraîne-toi aux examens",     icon: 'ti-clipboard-check',grad: 'from-orange-500 to-orange-600' },
  { href: '/assistance',    label: 'Assistance',  desc: 'Nous sommes là pour t’aider',  icon: 'ti-headset',        grad: 'from-violet-500 to-violet-700' },
];

function Dashboard({ name, progress }: { name: string; progress: Record<string, boolean> }) {
  const quizDone = Object.values(progress).filter(Boolean).length;
  const pct = Math.min(100, Math.round((quizDone / Math.max(1, TOTAL_QUIZZES)) * 100)) || 68;
  const stats = [
    { label: 'Jours',   value: 12,             icon: 'ti-calendar',        color: 'text-primary-600' },
    { label: 'Quiz',    value: quizDone || 45, icon: 'ti-cards',           color: 'text-success-600' },
    { label: 'Examens', value: 6,              icon: 'ti-clipboard-check', color: 'text-orange-500' },
    { label: 'Série',   value: '7 j',          icon: 'ti-flame',           color: 'text-violet-600' },
  ];

  return (
    <>
      {/* Hero header */}
      <header className="relative overflow-hidden rounded-b-[30px] bg-gradient-to-br from-primary-600 to-primary-800 px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-10 top-16 h-28 w-28 rounded-full bg-white/5" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Bonjour 👋</p>
            <p className="font-display text-2xl font-extrabold leading-tight">{name}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15" aria-label="Notifications">
              <i className="ti ti-bell text-lg" aria-hidden="true" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-orange-400 ring-2 ring-primary-700" />
            </button>
            <Link href="/profil" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-primary-700">
              {name.charAt(0).toUpperCase()}
            </Link>
          </div>
        </div>

        {/* Progression card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="relative mt-5 flex items-center gap-4 rounded-2xl bg-white/15 p-4 backdrop-blur-sm"
        >
          <div className="relative flex items-center justify-center">
            <ProgressRing value={pct} />
            <span className="absolute font-display text-base font-black">{pct}%</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Ma progression</p>
            <p className="mt-0.5 font-display text-lg font-bold">Très bien !</p>
            <p className="text-xs text-white/80">Continuez comme ça.</p>
          </div>
          <i className="ti ti-trending-up text-2xl text-white/80" aria-hidden="true" />
        </motion.div>
      </header>

      {/* Body */}
      <div className="px-5 pt-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2.5">
          {stats.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-token bg-surface-1 p-2.5 text-center shadow-soft">
              <i className={`ti ${s.icon} text-lg ${s.color}`} aria-hidden="true" />
              <p className="mt-1 font-display text-base font-black text-foreground">{s.value}</p>
              <p className="text-[10px] font-medium text-muted">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <p className="mb-3 mt-7 font-display text-base font-bold text-foreground">Accès rapides</p>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((q, i) => (
            <motion.div key={q.href}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.06 }}>
              <Link href={q.href}>
                <div className={`group relative flex h-32 flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br ${q.grad} p-4 text-white shadow-card transition-transform active:scale-[0.97]`}>
                  <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
                    <i className={`ti ${q.icon} text-2xl`} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-display text-base font-bold">{q.label}</p>
                    <p className="text-[11px] leading-tight text-white/80">{q.desc}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Premium banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-4">
          <Link href="/boutique">
            <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                <i className="ti ti-crown text-xl" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold text-foreground">Passez à l’accès illimité</p>
                <p className="text-xs text-secondary">{TOTAL_QUIZZES} quiz · séries d’examen · 2 500 FCFA/mois</p>
              </div>
              <i className="ti ti-chevron-right text-orange-500" aria-hidden="true" />
            </div>
          </Link>
        </motion.div>
      </div>
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [userName,  setUserName]  = useState('Conducteur');
  const [progress,  setProgress]  = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('permis_user');
      if (stored) {
        const u = JSON.parse(stored);
        setUserName(u.name || 'Conducteur');
        setOnboarded(true);
      } else {
        setOnboarded(false);
      }
      setProgress(JSON.parse(localStorage.getItem('quizz_progress') || '{}'));
    } catch {
      setOnboarded(false);
    }
  }, []);

  const handleOnboardingComplete = (name: string) => {
    try { localStorage.setItem('permis_user', JSON.stringify({ name, streak: 7, xp: 0 })); } catch {}
    setUserName(name);
    setOnboarded(true);
  };

  if (onboarded === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!onboarded) return <OnboardingScreen onComplete={handleOnboardingComplete} />;

  return (
    <AppShell>
      <Dashboard name={userName} progress={progress} />
    </AppShell>
  );
}
