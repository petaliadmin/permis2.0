// ─── Quiz Configuration ───────────────────────────────────────────────────────
// Organise les 14 catégories JSON en 5 super-catégories de jeu

export const FREE_QUESTIONS = 3; // questions gratuites pour les quizz premium

export type QuizItem = {
  id: string;
  title: string;
  categoryKey: string; // clé exacte dans questions_doc.json
  free: boolean; // toujours false — 3 questions gratuites par quizz uniquement
  emoji: string;
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

export const QUIZ_CATEGORIES: QuizCategory[] = [
  {
    slug: 'panneaux',
    title: 'Panneaux',
    icon: '🔺',
    gradient: 'from-orange-500 to-red-500',
    shadowColor: 'shadow-orange-200/60 dark:shadow-orange-900/30',
    ringColor: '#f97316',
    description: 'Maîtrise tous les panneaux de signalisation',
    quizzes: [
      { id: '1', title: 'Panneaux de danger',      categoryKey: 'Panneaux de danger',                    free: false,  emoji: '⚠️' },
      { id: '2', title: "Panneaux d'interdiction", categoryKey: "Panneaux d'interdiction",               free: false,  emoji: '🚫' },
      { id: '3', title: 'Panneaux de priorité',    categoryKey: 'Panneaux de priorité',                  free: false, emoji: '⬛' },
      { id: '4', title: 'Panneaux de direction',   categoryKey: 'Panneaux de direction',                 free: false, emoji: '🗺️' },
      { id: '5', title: 'Gabarit & Restrictions',  categoryKey: 'Restrictions (hauteur/largeur/poids)',  free: false, emoji: '📏' },
    ],
  },
  {
    slug: 'priorites',
    title: 'Priorités',
    icon: '⚡',
    gradient: 'from-yellow-400 to-amber-500',
    shadowColor: 'shadow-yellow-200/60 dark:shadow-yellow-900/30',
    ringColor: '#f59e0b',
    description: "Maîtrise les règles de priorité à l'intersection",
    quizzes: [
      { id: '1', title: 'Priorité aux intersections', categoryKey: 'Priorité aux intersections',          free: false,  emoji: '🔀' },
      { id: '2', title: 'Stop & Cédez le passage',    categoryKey: 'Priorité & Arrêt (STOP / Cédez)',    free: false,  emoji: '🛑' },
      { id: '3', title: 'Ronds-points & Giratoires',  categoryKey: 'Rond-point & Giratoire',             free: false, emoji: '🔄' },
    ],
  },
  {
    slug: 'circulation',
    title: 'Circulation',
    icon: '🚗',
    gradient: 'from-blue-500 to-cyan-500',
    shadowColor: 'shadow-blue-200/60 dark:shadow-blue-900/30',
    ringColor: '#3b82f6',
    description: 'Vitesse, dépassement et stationnement',
    quizzes: [
      { id: '1', title: 'Limitation de vitesse', categoryKey: 'Limitation de vitesse', free: false,  emoji: '🏎️' },
      { id: '2', title: 'Dépassement',            categoryKey: 'Dépassement',            free: false,  emoji: '↔️' },
      { id: '3', title: 'Stationnement & Arrêt', categoryKey: 'Stationnement & Arrêt', free: false, emoji: '🅿️' },
    ],
  },
  {
    slug: 'signaux',
    title: 'Signaux & Feux',
    icon: '🚦',
    gradient: 'from-green-500 to-emerald-500',
    shadowColor: 'shadow-green-200/60 dark:shadow-green-900/30',
    ringColor: '#16a34a',
    description: 'Feux de circulation et signalisation temporaire',
    quizzes: [
      { id: '1', title: 'Feux tricolores',          categoryKey: 'Feux tricolores',          free: false, emoji: '🚦' },
      { id: '2', title: 'Signalisation temporaire', categoryKey: 'Signalisation temporaire', free: false, emoji: '🔶' },
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
      { id: '1', title: 'Passage à niveau', categoryKey: 'Passage à niveau', free: false, emoji: '🚂' },
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
