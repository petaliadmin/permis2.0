// ─── Quiz Configuration ───────────────────────────────────────────────────────
// 10 séries de 15 questions, chacune piochant dans TOUTES les catégories
// (panneaux, priorités, circulation, signaux, situations) pour une couverture
// complète à chaque série. Le tirage est aléatoire à chaque session.

/** Séries 1 à 5 gratuites ; le reste nécessite premium_all (même logique que les examens). */
export const FREE_SERIES_UP_TO = 5;

export type QuizItem = {
  id: string;
  title: string;
  /** Toutes les catégories JSON tirées dans cette série. */
  categoryKeys: string[];
  emoji: string;
  /** Nombre de questions par session (tirage aléatoire équilibré). 0 = toutes. */
  questionsPerSession: number;
};

export type QuizCategory = {
  slug: string;
  title: string;
  icon: string;
  gradient: string;
  shadowColor: string;
  ringColor: string;
  description: string;
  quizzes: QuizItem[];
};

// ─── Toutes les catégories disponibles dans questions_doc.json ───────────────
// Chaque série pioche dans TOUTES ces catégories (panneaux, priorités,
// circulation, signaux, situations) pour garantir une couverture complète
// des règles, de la reconnaissance des panneaux et du code à chaque série.
export const ALL_CATEGORY_KEYS = [
  'Panneaux de danger',
  "Panneaux d'interdiction",
  'Panneaux de priorité',
  'Panneaux de direction',
  'Restrictions (hauteur/largeur/poids)',
  'Priorité aux intersections',
  'Priorité & Arrêt (STOP / Cédez)',
  'Rond-point & Giratoire',
  'Limitation de vitesse',
  'Dépassement',
  'Stationnement & Arrêt',
  'Feux tricolores',
  'Signalisation temporaire',
  'Passage à niveau',
];

const SERIES_EMOJIS = ['🎯', '🚦', '🔺', '⚡', '🚗', '🛑', '🔀', '⚠️', '🚂', '🏁'];

export const QUIZ_CATEGORIES: QuizCategory[] = [
  {
    slug: 'general',
    title: 'Quiz général',
    icon: '🎯',
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-200/60 dark:shadow-violet-900/30',
    ringColor: '#7c3aed',
    description: 'Panneaux, priorités, circulation, signaux, situations — tout mélangé',
    quizzes: Array.from({ length: 10 }, (_, i) => ({
      id: String(i + 1),
      title: `Série ${i + 1}`,
      categoryKeys: ALL_CATEGORY_KEYS,
      emoji: SERIES_EMOJIS[i],
      questionsPerSession: 15,
    })),
  },
];

export function getCategoryBySlug(slug: string): QuizCategory | undefined {
  return QUIZ_CATEGORIES.find((c) => c.slug === slug);
}

export function getQuizById(category: QuizCategory, quizId: string): QuizItem | undefined {
  return category.quizzes.find((q) => q.id === quizId);
}

export const TOTAL_QUIZZES = QUIZ_CATEGORIES.reduce((s, c) => s + c.quizzes.length, 0);

// ─── Tirage équilibré inter-catégories ────────────────────────────────────────
// Sélectionne `n` questions (ou toutes si n=0) en piochant proportionnellement
// dans chaque categoryKey, puis mélange le résultat.

export type SeriesProgress = { done: boolean; pct: number; stars: number };

export function calcStars(pct: number): number {
  if (pct >= 80) return 3;
  if (pct >= 60) return 2;
  if (pct >= 40) return 1;
  return 0;
}

interface RawQuestion {
  categorie: string;
}

export function buildSessionQuestions<T extends RawQuestion>(
  allQuestions: T[],
  categoryKeys: string[],
  questionsPerSession: number
): T[] {
  // Group by category
  const grouped: Record<string, T[]> = {};
  for (const key of categoryKeys) {
    grouped[key] = shuffle(allQuestions.filter((q) => q.categorie === key));
  }

  if (questionsPerSession === 0) {
    return interleave(grouped, categoryKeys);
  }

  const total = categoryKeys.reduce((s, k) => s + (grouped[k]?.length ?? 0), 0);
  const target = Math.min(questionsPerSession, total);

  // Largest-remainder apportionment: guarantees the picked counts sum to
  // exactly `target` (instead of independent rounding, which can undershoot
  // once there are many categories — e.g. 14 categories for 15 questions).
  const shares = categoryKeys.map((k) => {
    const available = grouped[k]?.length ?? 0;
    const raw = total > 0 ? (available / total) * target : 0;
    const base = Math.min(Math.floor(raw), available);
    return { key: k, available, base, remainder: raw - base };
  });

  let allocated = shares.reduce((s, sh) => s + sh.base, 0);
  for (const sh of [...shares].sort((a, b) => b.remainder - a.remainder)) {
    if (allocated >= target) break;
    if (sh.base < sh.available) {
      sh.base += 1;
      allocated += 1;
    }
  }

  const sliced = Object.fromEntries(shares.map((sh) => [sh.key, grouped[sh.key].slice(0, sh.base)]));
  return interleave(sliced, categoryKeys).slice(0, target);
}

function interleave<T>(grouped: Record<string, T[]>, keys: string[]): T[] {
  const result: T[] = [];
  const maxLen = Math.max(...keys.map((k) => grouped[k]?.length ?? 0));
  for (let i = 0; i < maxLen; i++) {
    for (const k of keys) {
      if (grouped[k]?.[i] !== undefined) result.push(grouped[k][i]);
    }
  }
  return result;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
