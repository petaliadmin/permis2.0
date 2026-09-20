'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Sheet } from '@permis2.0/ui';
import { useWolofAudio } from '@/hooks/useWolofAudio';
import { API_URL } from '@/lib/dataSource';
import { slugify } from '@/lib/slug';
import { categoryMeta as meta, CATEGORY_ORDER, HIDDEN_CATEGORIES } from '@/lib/trafficSignCategories';
import {
  IconChevronLeft,
  IconChevronRight,
  IconRoadSign,
  IconSearch,
  IconX,
  IconBulb,
  IconPlayerStopFilled,
  IconLanguage,
} from '@tabler/icons-react';

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

/* ─── Sign image with fallback ──────────────────────────── */
function SignImg({ code, name, size = 40 }: { code: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (err) return <IconRoadSign size="1em" className="text-2xl text-slate-400" aria-hidden="true" />;
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
export default function TrafficSignsClient({
  initialSigns = [],
  fullIndex,
}: {
  /** Server-fetched signs (app/traffic-signs/page.tsx) — seeds state so the
   *  picker never flashes "0 panneaux" pre-hydration; the effect below still
   *  refreshes/falls back to the offline JSON as before. */
  initialSigns?: PanneauRaw[];
  /** TrafficSignsFullIndex, passed in as a Server Component element by
   *  page.tsx so it renders inside AppShell's constrained-width container
   *  without this client component importing (and thus client-bundling) it. */
  fullIndex?: React.ReactNode;
}) {
  const [signs, setSigns] = useState<PanneauRaw[]>(initialSigns);
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

  const grouped = useMemo(() => {
    const g: Record<string, PanneauRaw[]> = {};
    for (const s of signs) (g[s.category] ??= []).push(s);
    return g;
  }, [signs]);

  const allCats = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c) && !HIDDEN_CATEGORIES.includes(c)),
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
        <div className="flex items-center gap-2 rounded-2xl border border-token bg-surface-2 px-4 py-2.5">
          <IconSearch size="1em" className="text-secondary" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedCat(null);
            }}
            placeholder="Rechercher un panneau…"
            className="w-full bg-transparent text-sm text-foreground placeholder-muted focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Effacer">
              <IconX size="1em" className="text-secondary" aria-hidden="true" />
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
                        <m.icon size="1em" className="text-2xl" style={{ color: m.color }} aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-bold text-foreground">{m.label}</p>
                      <p className="mt-0.5 text-xs text-secondary">
                        {list.length} panneau{list.length > 1 ? 'x' : ''}
                      </p>
                    </div>
                    <IconChevronRight size="1em" className="text-lg text-slate-300" aria-hidden="true" />
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
                <IconChevronLeft size="1em" aria-hidden="true" /> Toutes les catégories
              </button>
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: meta(selectedCat).color + '18' }}
                >
                  {(() => {
                    const SelectedCatIcon = meta(selectedCat).icon;
                    return (
                      <SelectedCatIcon
                        size="1em"
                        className="text-xl"
                        style={{ color: meta(selectedCat).color }}
                        aria-hidden="true"
                      />
                    );
                  })()}
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
                    <IconChevronLeft size="1em" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => nextCat && goToCat(nextCat)}
                    disabled={!nextCat}
                    aria-label="Catégorie suivante"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-token bg-surface-1 text-secondary shadow-soft transition-transform active:scale-95 disabled:opacity-30"
                  >
                    <IconChevronRight size="1em" aria-hidden="true" />
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
                    <IconChevronLeft
                      size="1em"
                      className="shrink-0 text-lg text-slate-400"
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
                    <IconChevronRight
                      size="1em"
                      className="shrink-0 text-lg text-slate-400"
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

      {fullIndex}

      {/* ── Detail bottom-sheet ── */}
      <Sheet open={!!selectedSign} onClose={closeSheet} ariaLabel="Détail du panneau">
        {selectedSign && (() => {
          const selMeta = meta(selectedSign.category);
          const SelIcon = selMeta.icon;
          return (
          <div className="flex flex-col items-center gap-4 pb-2">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="flex h-32 w-32 items-center justify-center rounded-3xl p-3"
              style={{ backgroundColor: selMeta.color + '15' }}
            >
              <SignImg code={selectedSign.code} name={selectedSign.name} size={96} />
            </motion.div>

            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{
                backgroundColor: selMeta.color + '18',
                color: selMeta.color,
              }}
            >
              <SelIcon size="1em" aria-hidden="true" />{' '}
              {selMeta.label}
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
                      style={{ backgroundColor: selMeta.color + '10' }}
                    >
                      <IconBulb
                        size="1em"
                        className="mt-0.5 shrink-0"
                        style={{ color: selMeta.color }}
                        aria-hidden="true"
                      />
                      <p className="text-sm leading-snug text-secondary">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-1 flex w-full gap-3">
              {wolof.available && (
                <button
                  onClick={wolof.toggle}
                  className="btn-primary flex-1"
                  aria-label="Écouter en wolof"
                >
                  {wolof.playing ? (
                    <IconPlayerStopFilled size="1em" aria-hidden="true" />
                  ) : (
                    <IconLanguage size="1em" aria-hidden="true" />
                  )}
                  {wolof.playing ? 'Stop' : 'Wolof'}
                </button>
              )}
              <Link
                href={`/traffic-signs/${slugify(selectedSign.name)}`}
                className="btn-ghost flex-1 text-center"
              >
                Fiche complète
              </Link>
            </div>
          </div>
          );
        })()}
      </Sheet>
    </AppShell>
  );
}
