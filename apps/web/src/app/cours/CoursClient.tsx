'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Skeleton } from '@permis2.0/ui';
import { fetchWithCache } from '@/lib/offlineCache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface LessonMeta {
  id: string;
  titre: string;
  contenu: string;
  points_cles: string[];
  illustrations?: string[];
  category?: { id: string; label: string; couleur?: string | null; icone?: string | null };
}

/* ─── Thèmes pédagogiques (regroupent les catégories fines de la base) ───────── */
interface Theme {
  id: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
  /** Labels de catégories rattachées à ce thème. */
  categories: string[];
}

const THEMES: Theme[] = [
  {
    id: 'priorites',
    label: 'Priorités & intersections',
    desc: 'Priorité à droite, STOP, cédez, giratoire',
    icon: 'ti-arrows-cross',
    color: '#F59E0B',
    categories: [
      'Priorité aux intersections',
      'Priorité & Arrêt (STOP / Cédez)',
      'Panneaux de priorité',
      'Rond-point & Giratoire',
    ],
  },
  {
    id: 'signalisation',
    label: 'Panneaux & signalisation',
    desc: 'Panneaux, marquage, feux, agents, chantiers',
    icon: 'ti-road-sign',
    color: '#EF4444',
    categories: [
      'Panneaux de danger',
      "Panneaux d'interdiction",
      'Panneaux de direction',
      'Signalisation de voie',
      'Restrictions (hauteur/largeur/poids)',
      'Signalisation temporaire',
      'Feux tricolores',
      'Signaux des agents',
    ],
  },
  {
    id: 'circulation',
    label: 'Règles de circulation',
    desc: 'Vitesses, dépassement, stationnement, rail',
    icon: 'ti-car',
    color: '#2563EB',
    categories: [
      'Limitation de vitesse',
      'Dépassement',
      'Stationnement & Arrêt',
      'Passage à niveau',
      'Circulation routière',
      'Manœuvres',
    ],
  },
  {
    id: 'securite',
    label: 'Sécurité & comportement',
    desc: 'Ceinture, secours, éclairage, vigilance',
    icon: 'ti-shield-check',
    color: '#16A34A',
    categories: [
      'Sécurité passive',
      'Premiers secours & Accidents',
      'Éclairage du véhicule',
      'Comportement du conducteur',
      'Usagers vulnérables',
      'Véhicule et équipements',
      'Réglementation',
    ],
  },
];

const OTHER_THEME: Theme = {
  id: 'autres',
  label: 'Autres leçons',
  desc: 'Leçons hors thèmes principaux',
  icon: 'ti-book',
  color: '#64748B',
  categories: [],
};

function themeOf(lesson: LessonMeta): Theme {
  const label = lesson.category?.label ?? '';
  return THEMES.find((t) => t.categories.includes(label)) ?? OTHER_THEME;
}

/** List thumbnail: first associated sign, falling back to a book icon. */
function LessonThumb({ lesson, color }: { lesson: LessonMeta; color: string }) {
  const [err, setErr] = useState(false);
  const src = lesson.illustrations?.[0];
  if (!src || err) {
    return (
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: color + '18' }}
      >
        <i className="ti ti-book text-xl" style={{ color }} aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 p-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-contain" onError={() => setErr(true)} />
    </div>
  );
}

function LessonCard({ lesson, color }: { lesson: LessonMeta; color: string }) {
  return (
    <Link
      href={`/cours/${lesson.id}`}
      className="flex w-full items-center gap-4 rounded-2xl border border-token bg-surface-1 px-4 py-3.5 text-left shadow-soft transition-transform active:scale-[0.98]"
    >
      <LessonThumb lesson={lesson} color={color} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-display text-sm font-bold leading-tight text-foreground">
          {lesson.titre}
        </p>
        {lesson.category && (
          <p className="mt-0.5 truncate text-xs text-secondary">{lesson.category.label}</p>
        )}
      </div>
      <i className="ti ti-chevron-right text-lg text-slate-300" aria-hidden="true" />
    </Link>
  );
}

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1], duration: 0.3 } },
};

export default function CoursClient() {
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  useEffect(() => {
    fetchWithCache<{ data: LessonMeta[] }>('lessons:list', `${API_URL}/lessons?take=100`)
      .then(({ data }) => setLessons(data.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  /** Lessons grouped by theme, pedagogical order, empty themes dropped. */
  const grouped = useMemo(() => {
    const map = new Map<string, { theme: Theme; lessons: LessonMeta[] }>();
    for (const theme of [...THEMES, OTHER_THEME]) map.set(theme.id, { theme, lessons: [] });
    for (const lesson of lessons) map.get(themeOf(lesson).id)!.lessons.push(lesson);
    return [...map.values()].filter((g) => g.lessons.length > 0);
  }, [lessons]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return lessons.filter(
      (l) =>
        l.titre.toLowerCase().includes(q) ||
        (l.category?.label ?? '').toLowerCase().includes(q) ||
        l.contenu.toLowerCase().includes(q)
    );
  }, [query, lessons]);

  const searching = query.trim().length > 0;
  const current = selectedTheme ? grouped.find((g) => g.theme.id === selectedTheme) : undefined;

  // Prev/next theme navigation inside a theme view
  const themeIndex = current ? grouped.findIndex((g) => g.theme.id === current.theme.id) : -1;
  const prevTheme = themeIndex > 0 ? grouped[themeIndex - 1].theme : null;
  const nextTheme =
    themeIndex >= 0 && themeIndex < grouped.length - 1 ? grouped[themeIndex + 1].theme : null;
  const goToTheme = (id: string) => {
    setSelectedTheme(id);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  };

  return (
    <AppShell>
      <PageHeader
        title="Cours"
        subtitle={`${lessons.length} leçons · ${grouped.length} thèmes`}
        accent="blue"
        menu={!selectedTheme}
      >
        <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
          <i className="ti ti-search text-white/80" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedTheme(null);
            }}
            placeholder="Rechercher une leçon…"
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
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mt-10 text-center">
            <i className="ti ti-wifi-off text-4xl text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm text-secondary">
              Impossible de charger les leçons. Vérifie ta connexion puis réessaie.
            </p>
          </div>
        )}

        {!loading && !error && (
          <AnimatePresence mode="wait">
            {/* ── Search results (flat) ── */}
            {searching && (
              <motion.div
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2.5"
              >
                {searchResults.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    color={lesson.category?.couleur || themeOf(lesson).color}
                  />
                ))}
                {searchResults.length === 0 && (
                  <p className="mt-8 text-center text-sm text-muted">Aucune leçon trouvée.</p>
                )}
              </motion.div>
            )}

            {/* ── Level 1: theme list ── */}
            {!searching && !selectedTheme && (
              <motion.div
                key="themes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2.5"
              >
                {grouped.map((group, i) => (
                  <motion.button
                    key={group.theme.id}
                    variants={rowVariants}
                    initial="hidden"
                    animate="show"
                    transition={{ delay: i * 0.05 }}
                    onClick={() => goToTheme(group.theme.id)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-token bg-surface-1 px-4 py-4 text-left shadow-soft transition-transform active:scale-[0.98]"
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: group.theme.color + '18' }}
                    >
                      <i
                        className={`ti ${group.theme.icon} text-2xl`}
                        style={{ color: group.theme.color }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-bold text-foreground">
                        {group.theme.label}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-secondary">{group.theme.desc}</p>
                      <p
                        className="mt-1 text-xs font-semibold"
                        style={{ color: group.theme.color }}
                      >
                        {group.lessons.length} leçon{group.lessons.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <i className="ti ti-chevron-right text-lg text-slate-300" aria-hidden="true" />
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* ── Level 2: lessons of the selected theme ── */}
            {!searching && current && (
              <motion.div
                key={current.theme.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => setSelectedTheme(null)}
                  className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary-600"
                >
                  <i className="ti ti-chevron-left" aria-hidden="true" /> Tous les thèmes
                </button>

                {/* Theme header + prev/next */}
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: current.theme.color + '18' }}
                  >
                    <i
                      className={`ti ${current.theme.icon} text-xl`}
                      style={{ color: current.theme.color }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-bold text-foreground">
                      {current.theme.label}
                    </h2>
                    <p className="text-xs text-secondary">
                      {current.lessons.length} leçon{current.lessons.length > 1 ? 's' : ''} ·{' '}
                      {themeIndex + 1}/{grouped.length}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => prevTheme && goToTheme(prevTheme.id)}
                      disabled={!prevTheme}
                      aria-label="Thème précédent"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-token bg-surface-1 text-secondary shadow-soft transition-transform active:scale-95 disabled:opacity-30"
                    >
                      <i className="ti ti-chevron-left" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => nextTheme && goToTheme(nextTheme.id)}
                      disabled={!nextTheme}
                      aria-label="Thème suivant"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-token bg-surface-1 text-secondary shadow-soft transition-transform active:scale-95 disabled:opacity-30"
                    >
                      <i className="ti ti-chevron-right" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {current.lessons.map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      color={lesson.category?.couleur || current.theme.color}
                    />
                  ))}
                </div>

                {/* Prev / next theme footer */}
                <div className="mt-5 flex items-stretch gap-3 pb-2">
                  {prevTheme ? (
                    <button
                      onClick={() => goToTheme(prevTheme.id)}
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
                          style={{ color: prevTheme.color }}
                        >
                          {prevTheme.label}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <div className="flex-1" />
                  )}
                  {nextTheme ? (
                    <button
                      onClick={() => goToTheme(nextTheme.id)}
                      className="flex flex-1 items-center justify-end gap-2.5 rounded-2xl border border-token bg-surface-1 px-3.5 py-3 text-right shadow-soft transition-transform active:scale-[0.98]"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                          Suivant
                        </p>
                        <p
                          className="truncate text-sm font-bold"
                          style={{ color: nextTheme.color }}
                        >
                          {nextTheme.label}
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
        )}
      </div>
    </AppShell>
  );
}
