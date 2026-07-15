// ─── Quiz Configuration ───────────────────────────────────────────────────────
// Chaque série mélange TOUTES les sous-catégories de sa thématique.
// Le tirage est aléatoire à chaque session → chaque partie est différente.

export const FREE_QUESTIONS = 3; // questions gratuites pour les utilisateurs non-abonnés

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

// ─── Catégories disponibles dans questions_doc.json ───────────────────────────
const PANNEAU_KEYS = [
  'Panneaux de danger',
  "Panneaux d'interdiction",
  'Panneaux de priorité',
  'Panneaux de direction',
  'Restrictions (hauteur/largeur/poids)',
];

const PRIORITE_KEYS = [
  'Priorité aux intersections',
  'Priorité & Arrêt (STOP / Cédez)',
  'Rond-point & Giratoire',
];

const CIRCULATION_KEYS = ['Limitation de vitesse', 'Dépassement', 'Stationnement & Arrêt'];

const SIGNAUX_KEYS = ['Feux tricolores', 'Signalisation temporaire'];

const SITUATIONS_KEYS = ['Passage à niveau'];

export const QUIZ_CATEGORIES: QuizCategory[] = [
  {
    slug: 'panneaux',
    title: 'Panneaux',
    icon: '🔺',
    gradient: 'from-orange-500 to-red-500',
    shadowColor: 'shadow-orange-200/60 dark:shadow-orange-900/30',
    ringColor: '#f97316',
    description: 'Danger, interdiction, priorité, direction… tous les panneaux mélangés',
    quizzes: [
      {
        id: '1',
        title: 'Panneaux — Série 1',
        categoryKeys: PANNEAU_KEYS,
        emoji: '🔺',
        questionsPerSession: 15,
      },
      {
        id: '2',
        title: 'Panneaux — Série 2',
        categoryKeys: PANNEAU_KEYS,
        emoji: '⚠️',
        questionsPerSession: 15,
      },
      {
        id: '3',
        title: 'Panneaux — Série 3',
        categoryKeys: PANNEAU_KEYS,
        emoji: '🚫',
        questionsPerSession: 15,
      },
      {
        id: '4',
        title: 'Panneaux — Maîtrise',
        categoryKeys: PANNEAU_KEYS,
        emoji: '🏆',
        questionsPerSession: 0,
      },
    ],
  },
  {
    slug: 'priorites',
    title: 'Priorités',
    icon: '⚡',
    gradient: 'from-yellow-400 to-amber-500',
    shadowColor: 'shadow-yellow-200/60 dark:shadow-yellow-900/30',
    ringColor: '#f59e0b',
    description: 'Intersections, STOP, cédez le passage, giratoires — tout en un',
    quizzes: [
      {
        id: '1',
        title: 'Priorités — Série 1',
        categoryKeys: PRIORITE_KEYS,
        emoji: '🔀',
        questionsPerSession: 12,
      },
      {
        id: '2',
        title: 'Priorités — Série 2',
        categoryKeys: PRIORITE_KEYS,
        emoji: '🛑',
        questionsPerSession: 12,
      },
      {
        id: '3',
        title: 'Priorités — Maîtrise',
        categoryKeys: PRIORITE_KEYS,
        emoji: '🏆',
        questionsPerSession: 0,
      },
    ],
  },
  {
    slug: 'circulation',
    title: 'Circulation',
    icon: '🚗',
    gradient: 'from-blue-500 to-cyan-500',
    shadowColor: 'shadow-blue-200/60 dark:shadow-blue-900/30',
    ringColor: '#3b82f6',
    description: 'Vitesse, dépassement et stationnement mélangés',
    quizzes: [
      {
        id: '1',
        title: 'Circulation — Série 1',
        categoryKeys: CIRCULATION_KEYS,
        emoji: '🏎️',
        questionsPerSession: 12,
      },
      {
        id: '2',
        title: 'Circulation — Série 2',
        categoryKeys: CIRCULATION_KEYS,
        emoji: '↔️',
        questionsPerSession: 12,
      },
      {
        id: '3',
        title: 'Circulation — Maîtrise',
        categoryKeys: CIRCULATION_KEYS,
        emoji: '🏆',
        questionsPerSession: 0,
      },
    ],
  },
  {
    slug: 'signaux',
    title: 'Signaux & Feux',
    icon: '🚦',
    gradient: 'from-green-500 to-emerald-500',
    shadowColor: 'shadow-green-200/60 dark:shadow-green-900/30',
    ringColor: '#16a34a',
    description: 'Feux tricolores et signalisation temporaire ensemble',
    quizzes: [
      {
        id: '1',
        title: 'Signaux — Série 1',
        categoryKeys: SIGNAUX_KEYS,
        emoji: '🚦',
        questionsPerSession: 10,
      },
      {
        id: '2',
        title: 'Signaux — Série 2',
        categoryKeys: SIGNAUX_KEYS,
        emoji: '🔶',
        questionsPerSession: 10,
      },
      {
        id: '3',
        title: 'Signaux — Maîtrise',
        categoryKeys: SIGNAUX_KEYS,
        emoji: '🏆',
        questionsPerSession: 0,
      },
    ],
  },
  {
    slug: 'situations',
    title: 'Situations',
    icon: '⚠️',
    gradient: 'from-rose-500 to-pink-600',
    shadowColor: 'shadow-rose-200/60 dark:shadow-rose-900/30',
    ringColor: '#f43f5e',
    description: 'Passages à niveau et situations dangereuses',
    quizzes: [
      {
        id: '1',
        title: 'Passage à niveau — Série 1',
        categoryKeys: SITUATIONS_KEYS,
        emoji: '🚂',
        questionsPerSession: 8,
      },
      {
        id: '2',
        title: 'Passage à niveau — Maîtrise',
        categoryKeys: SITUATIONS_KEYS,
        emoji: '🏆',
        questionsPerSession: 0,
      },
    ],
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
  const sliced = Object.fromEntries(
    categoryKeys.map((k) => [
      k,
      grouped[k].slice(
        0,
        Math.max(1, Math.round((grouped[k].length / total) * questionsPerSession))
      ),
    ])
  );
  return interleave(sliced, categoryKeys).slice(0, questionsPerSession);
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
