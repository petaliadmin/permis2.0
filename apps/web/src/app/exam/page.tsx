'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Skeleton } from '@permis2.0/ui';
import { useAuthStore } from '@/store/authStore';
import { usePurchasesStore } from '@/store/purchasesStore';

interface DiapoMeta {
  id: number;
  title: string;
  questions: { q: number }[];
}

/** Diapos 1–5 are free; the rest require pack_exams or premium_all. */
const FREE_UP_TO = 5;

const TABS = [
  { id: 'tous',    label: 'Tous' },
  { id: 'gratuits',label: 'Gratuits' },
  { id: 'premium', label: 'Premium' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const THUMB_GRAD = [
  'from-primary-500 to-primary-700',
  'from-violet-500 to-violet-700',
  'from-orange-500 to-orange-600',
  'from-success-500 to-success-700',
  'from-danger-500 to-danger-600',
];

function difficulty(n: number): { label: string; cls: string } {
  if (n <= 2) return { label: 'Facile', cls: 'chip-success' };
  if (n <= 5) return { label: 'Moyen', cls: 'chip-xp' };
  return { label: 'Difficile', cls: 'chip-danger' };
}

export default function ExamPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasKey = usePurchasesStore((s) => s.hasKey);
  const fetchEntitlements = usePurchasesStore((s) => s.fetchEntitlements);

  const [exams, setExams] = useState<DiapoMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('tous');

  useEffect(() => {
    fetch('/data/diapos.json').then((r) => r.json()).then((d) => setExams(d.exams)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (isAuthenticated) fetchEntitlements(); }, [isAuthenticated, fetchEntitlements]);

  const unlockedAll = hasKey('pack_exams');

  const filtered = useMemo(() => {
    if (tab === 'gratuits') return exams.filter((e) => e.id <= FREE_UP_TO);
    if (tab === 'premium') return exams.filter((e) => e.id > FREE_UP_TO);
    return exams;
  }, [tab, exams]);

  const handleStart = (exam: DiapoMeta) => {
    const hasAccess = exam.id <= FREE_UP_TO || unlockedAll;
    if (!hasAccess) { router.push(isAuthenticated ? '/boutique' : '/auth/login'); return; }
    router.push(`/exam/diapo/${exam.id}`);
  };

  return (
    <AppShell>
      <PageHeader title="Examens" subtitle="Séries d’entraînement conformes à l’examen" accent="orange" menu
        actions={
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15" aria-label="Info">
            <i className="ti ti-info-circle text-lg" aria-hidden="true" />
          </button>
        }
      >
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${tab === t.id ? 'bg-white text-orange-600' : 'bg-white/15 text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="px-5 pt-6">
        {!unlockedAll && (
          <button onClick={() => router.push(isAuthenticated ? '/boutique' : '/auth/login')}
            className="mb-5 flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-left text-white shadow-md transition-transform active:scale-[0.98]">
            <i className="ti ti-lock-open text-2xl" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-extrabold">Débloquer toutes les séries</p>
              <p className="text-xs opacity-85">Pack Examens — Orange Money / Wave</p>
            </div>
            <i className="ti ti-chevron-right text-lg" aria-hidden="true" />
          </button>
        )}

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((exam, i) => {
              const isFree = exam.id <= FREE_UP_TO;
              const unlocked = isFree || unlockedAll;
              const n = exam.questions.length;
              const diff = difficulty(exam.id);
              const dur = Math.max(10, Math.round(n * 1.2));
              return (
                <motion.button key={exam.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.98 }} onClick={() => handleStart(exam)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-token bg-surface-1 p-3 text-left shadow-soft">
                  <div className={`relative flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${THUMB_GRAD[i % THUMB_GRAD.length]}`}>
                    <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full bg-white/15" />
                    {unlocked ? (
                      <span className="font-display text-2xl font-black text-white">{exam.id}</span>
                    ) : (
                      <i className="ti ti-lock text-2xl text-white" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold leading-tight text-foreground">{exam.title}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-secondary">
                      <span className="flex items-center gap-1"><i className="ti ti-list-numbers" aria-hidden="true" />{n} q</span>
                      <span className="flex items-center gap-1"><i className="ti ti-clock" aria-hidden="true" />{dur} min</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`chip ${diff.cls}`}>{diff.label}</span>
                      {isFree ? <span className="chip chip-success">Gratuit</span>
                        : !unlocked ? <span className="chip chip-orange">Premium</span>
                        : <span className="chip chip-primary">Débloqué</span>}
                    </div>
                  </div>
                  <i className="ti ti-chevron-right text-lg text-slate-300" aria-hidden="true" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
