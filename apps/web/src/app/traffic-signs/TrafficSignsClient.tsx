'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Sheet } from '@permis2.0/ui';
import { useWolofAudio } from '@/hooks/useWolofAudio';
import { API_URL } from '@/lib/dataSource';

/** Shape returned by GET /traffic-signs (DB) — mapped to the UI shape below. */
interface ApiSign {
  code: string | null;
  name: string;
  category: string;
  description: string;
  advice: string[];
  icone?: string | null;
}

/* ─── Types ─────────────────────────────────────────────── */
interface PanneauRaw {
  name: string;
  code: string;
  description: string;
  category: string;
  icon: string;
  advice?: string[];
}
interface CategoryMeta {
  label: string;
  icon: string;
  color: string;
}

/* ─── Category metadata (icon + road-code color) ─────────── */
const CAT_META: Record<string, CategoryMeta> = {
  danger: { label: 'Danger', icon: 'ti-alert-triangle', color: '#EF4444' },
  interdiction: { label: 'Interdiction', icon: 'ti-ban', color: '#DC2626' },
  priorité: { label: 'Priorité', icon: 'ti-square-rotated', color: '#F59E0B' },
  obligation: { label: 'Obligation', icon: 'ti-arrow-right', color: '#2563EB' },
  indication: { label: 'Indication', icon: 'ti-arrow-up', color: '#0000FD' },
  temporaires: { label: 'Temporaires', icon: 'ti-traffic-cone', color: '#F97316' },
  balises: { label: 'Balises', icon: 'ti-map-pin', color: '#64748B' },
  marquage: { label: 'Marquage sol', icon: 'ti-road', color: '#71717A' },
  feux: { label: 'Feux tricolores', icon: 'ti-traffic-lights', color: '#16A34A' },
  agents: { label: 'Agents', icon: 'ti-user-shield', color: '#7C3AED' },
};
function meta(cat: string): CategoryMeta {
  return CAT_META[cat] ?? { label: cat, icon: 'ti-road-sign', color: '#64748B' };
}

/* ─── Sign image with fallback ──────────────────────────── */
function SignImg({ code, name, size = 40 }: { code: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (err) return <i className="ti ti-road-sign text-2xl text-slate-400" aria-hidden="true" />;
  return (
    <Image
      src={`/icons/panneaux/${code}.svg`}
      alt={name}
      width={size}
      height={size}
      className="h-full w-full object-contain"
      unoptimized
      onError={() => setErr(true)}
    />
  );
}

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1], duration: 0.3 } },
};

/* ─── Page ───────────────────────────────────────────────── */
export default function TrafficSignsClient() {
  const [signs, setSigns] = useState<PanneauRaw[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedSign, setSelectedSign] = useState<PanneauRaw | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    // Content lives in the database; the bundled JSON is only an offline fallback.
    fetch(`${API_URL}/traffic-signs?take=300`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: { data: ApiSign[] }) =>
        setSigns(
          d.data
            .filter((s) => s.code)
            .map((s) => ({
              code: s.code as string,
              name: s.name,
              category: s.category,
              description: s.description,
              icon: s.icone ?? '',
              advice: s.advice,
            }))
        )
      )
      .catch(() =>
        fetch('/data/panneaux.json')
          .then((r) => r.json())
          .then(setSigns)
          .catch(console.error)
      );
  }, []);

  // Ordre pédagogique : dangers → règles de priorité → interdictions → obligations,
  // puis panneaux d'information et signalisation complémentaire.
  const catOrder = ['danger', 'priorité', 'interdiction', 'obligation', 'indication'];
  // Catégories retirées de la liste (trop peu de panneaux pour justifier leur propre carte).
  const HIDDEN_CATS = ['temporaires', 'balises', 'marquage', 'feux', 'agents'];

  const grouped = useMemo(() => {
    const g: Record<string, PanneauRaw[]> = {};
    for (const s of signs) (g[s.category] ??= []).push(s);
    return g;
  }, [signs]);

  const allCats = [
    ...catOrder.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !catOrder.includes(c) && !HIDDEN_CATS.includes(c)),
  ];

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!q) return [];
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    // Name and code matches first, then description matches
    const primary = signs.filter((s) => norm(s.name).includes(q) || norm(s.code).includes(q));
    const secondary = signs.filter((s) => !primary.includes(s) && norm(s.description).includes(q));
    return [...primary, ...secondary].slice(0, 40);
  }, [query, signs]);

  const catSigns = selectedCat ? (grouped[selectedCat] ?? []) : [];
  const showingSearch = query.trim().length > 0;

  // Prev/next category navigation inside a category view
  const catIndex = selectedCat ? allCats.indexOf(selectedCat) : -1;
  const prevCat = catIndex > 0 ? allCats[catIndex - 1] : null;
  const nextCat = catIndex >= 0 && catIndex < allCats.length - 1 ? allCats[catIndex + 1] : null;
  const goToCat = (cat: string) => {
    setSelectedCat(cat);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  };

  const wolof = useWolofAudio(
    selectedSign ? `/audio/wolof/panneaux/${selectedSign.code}.mp3` : null
  );

  const closeSheet = () => {
    wolof.stop();
    setSelectedSign(null);
  };

  const SignCard = ({ sign }: { sign: PanneauRaw }) => (
    <button
      onClick={() => setSelectedSign(sign)}
      className="flex flex-col items-center gap-2.5 rounded-2xl border border-token bg-surface-1 p-3 pt-4 text-center shadow-soft transition-transform active:scale-95"
    >
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-surface-2 p-3">
        <SignImg code={sign.code} name={sign.name} size={150} />
      </div>
      <div className="w-full">
        <p className="line-clamp-2 text-xs font-bold leading-tight text-foreground">{sign.name}</p>
      </div>
    </button>
  );

  return (
    <AppShell>
      <PageHeader
        title="Panneaux"
        subtitle={`${signs.length} panneaux · ${allCats.length} catégories`}
        accent="blue"
        menu={!selectedCat}
      >
        <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
          <i className="ti ti-search text-white/80" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedCat(null);
            }}
            placeholder="Rechercher un panneau…"
            className="w-full bg-transparent text-sm text-white placeholder-white/60 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Effacer">
              <i className="ti ti-x text-white/70" aria-hidden="true" />
            </button>
          )}
        </div>
      </PageHeader>

      <div className="px-4 pt-5">
        <AnimatePresence mode="wait">
          {/* ── Search results ── */}
          {showingSearch && (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              {searchResults.map((sign) => (
                <SignCard key={sign.code} sign={sign} />
              ))}
              {searchResults.length === 0 && (
                <p className="col-span-2 mt-8 text-center text-sm text-muted">
                  Aucun panneau trouvé.
                </p>
              )}
            </motion.div>
          )}

          {/* ── Category list ── */}
          {!showingSearch && !selectedCat && (
            <motion.div
              key="categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2.5"
            >
              {allCats.map((cat, i) => {
                const m = meta(cat);
                const list = grouped[cat] ?? [];
                return (
                  <motion.button
                    key={cat}
                    variants={rowVariants}
                    initial="hidden"
                    animate="show"
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedCat(cat)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-token bg-surface-1 px-4 py-3 text-left shadow-soft transition-transform active:scale-[0.98]"
                  >
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl p-2"
                      style={{ backgroundColor: m.color + '18' }}
                    >
                      {list[0] ? (
                        <SignImg code={list[0].code} name={m.label} size={56} />
                      ) : (
                        <i
                          className={`ti ${m.icon} text-2xl`}
                          style={{ color: m.color }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-bold text-foreground">{m.label}</p>
                      <p className="mt-0.5 text-xs text-secondary">
                        {list.length} panneau{list.length > 1 ? 'x' : ''}
                      </p>
                    </div>
                    <i className="ti ti-chevron-right text-lg text-slate-300" aria-hidden="true" />
                  </motion.button>
                );
              })}
            </motion.div>
          )}

          {/* ── Signs of a category ── */}
          {!showingSearch && selectedCat && (
            <motion.div
              key={selectedCat}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={() => setSelectedCat(null)}
                className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary-600"
              >
                <i className="ti ti-chevron-left" aria-hidden="true" /> Toutes les catégories
              </button>
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: meta(selectedCat).color + '18' }}
                >
                  <i
                    className={`ti ${meta(selectedCat).icon} text-xl`}
                    style={{ color: meta(selectedCat).color }}
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-bold text-foreground">
                    {meta(selectedCat).label}
                  </h2>
                  <p className="text-xs text-secondary">
                    {catSigns.length} panneau{catSigns.length > 1 ? 'x' : ''} · {catIndex + 1}/
                    {allCats.length}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => prevCat && goToCat(prevCat)}
                    disabled={!prevCat}
                    aria-label="Catégorie précédente"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-token bg-surface-1 text-secondary shadow-soft transition-transform active:scale-95 disabled:opacity-30"
                  >
                    <i className="ti ti-chevron-left" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => nextCat && goToCat(nextCat)}
                    disabled={!nextCat}
                    aria-label="Catégorie suivante"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-token bg-surface-1 text-secondary shadow-soft transition-transform active:scale-95 disabled:opacity-30"
                  >
                    <i className="ti ti-chevron-right" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {catSigns.map((sign) => (
                  <SignCard key={sign.code} sign={sign} />
                ))}
              </div>

              {/* Prev / next category */}
              <div className="mt-5 flex items-stretch gap-3 pb-2">
                {prevCat ? (
                  <button
                    onClick={() => goToCat(prevCat)}
                    className="flex flex-1 items-center gap-2.5 rounded-2xl border border-token bg-surface-1 px-3.5 py-3 text-left shadow-soft transition-transform active:scale-[0.98]"
                  >
                    <i
                      className="ti ti-chevron-left shrink-0 text-lg text-slate-400"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                        Précédent
                      </p>
                      <p
                        className="truncate text-sm font-bold"
                        style={{ color: meta(prevCat).color }}
                      >
                        {meta(prevCat).label}
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="flex-1" />
                )}
                {nextCat ? (
                  <button
                    onClick={() => goToCat(nextCat)}
                    className="flex flex-1 items-center justify-end gap-2.5 rounded-2xl border border-token bg-surface-1 px-3.5 py-3 text-right shadow-soft transition-transform active:scale-[0.98]"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                        Suivant
                      </p>
                      <p
                        className="truncate text-sm font-bold"
                        style={{ color: meta(nextCat).color }}
                      >
                        {meta(nextCat).label}
                      </p>
                    </div>
                    <i
                      className="ti ti-chevron-right shrink-0 text-lg text-slate-400"
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Detail bottom-sheet ── */}
      <Sheet open={!!selectedSign} onClose={closeSheet} ariaLabel="Détail du panneau">
        {selectedSign && (
          <div className="flex flex-col items-center gap-4 pb-2">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="flex h-32 w-32 items-center justify-center rounded-3xl p-3"
              style={{ backgroundColor: meta(selectedSign.category).color + '15' }}
            >
              <SignImg code={selectedSign.code} name={selectedSign.name} size={96} />
            </motion.div>

            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{
                backgroundColor: meta(selectedSign.category).color + '18',
                color: meta(selectedSign.category).color,
              }}
            >
              <i className={`ti ${meta(selectedSign.category).icon}`} aria-hidden="true" />{' '}
              {meta(selectedSign.category).label}
            </span>

            <div className="w-full text-center">
              <h2 className="font-display text-xl font-extrabold text-foreground">
                {selectedSign.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                {selectedSign.description}
              </p>
            </div>

            {selectedSign.advice && selectedSign.advice.length > 0 && (
              <div className="w-full">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                  Conseils
                </p>
                <div className="space-y-2">
                  {selectedSign.advice.map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                      style={{ backgroundColor: meta(selectedSign.category).color + '10' }}
                    >
                      <i
                        className="ti ti-bulb mt-0.5 shrink-0"
                        style={{ color: meta(selectedSign.category).color }}
                        aria-hidden="true"
                      />
                      <p className="text-sm leading-snug text-secondary">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wolof.available && (
              <div className="mt-1 flex w-full gap-3">
                <button
                  onClick={wolof.toggle}
                  className="btn-primary flex-1"
                  aria-label="Écouter en wolof"
                >
                  <i
                    className={`ti ${wolof.playing ? 'ti-player-stop-filled' : 'ti-language'}`}
                    aria-hidden="true"
                  />
                  {wolof.playing ? 'Stop' : 'Wolof'}
                </button>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </AppShell>
  );
}
