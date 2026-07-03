export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  passwordHash?: string | null;
  googleId?: string | null;
  xp: number;
  level: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

// Category Types
export interface Category {
  id: string;
  label: string;
  description: string;
  couleur: string;
  icone: string;
  /** Free categories are browsable without an account. Defaults true. */
  isFree?: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Computed by the API (category counts)
  questionCount?: number;
  lessonCount?: number;
}

// Lesson Types
export interface Lesson {
  id: string;
  categoryId: string;
  titre: string;
  contenu: string;
  points_cles: string[];
  exceptions?: string[];
  erreurs_frequentes?: string[];
  regles?: string[];
  illustrations?: string[];
  /** Free lessons are readable without an account. Defaults true. */
  isFree?: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Optionally included by the API
  category?: Pick<Category, 'id' | 'label' | 'couleur' | 'icone'>;
}

// Question Types
export interface Choice {
  id: string;
  questionId: string;
  text: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  serieId: string;
  categoryId: string;
  numero: number;
  enonce: string;
  image?: string;
  signalisation_visible?: string;
  choices: Choice[];
  reponses_correctes: string[];
  explication: string;
  createdAt: Date;
  updatedAt: Date;
}

// Series Types
export interface Series {
  id: string;
  name: string;
  description: string;
  code: string;
  /** Free series are playable without an account. Defaults true. */
  isFree?: boolean;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
  /** Computed by the API for the current viewer (premium series not yet unlocked). */
  locked?: boolean;
}

// Conduite (practical driving) Types — Sprint 4
export interface DrivingQuestion {
  id: string;
  courseId: string;
  numero: number;
  enonce: string;
  image?: string;
  choices: Choice[];
  reponses_correctes: string[];
  explication: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DrivingCourse {
  id: string;
  slug: string;
  titre: string;
  resume: string;
  contenu: string;
  conseils: string[];
  erreurs_frequentes: string[];
  illustrations: string[];
  ordre: number;
  /** Free courses are readable/playable without an account. Defaults true. */
  isFree?: boolean;
  /** Provisional editorial content, to be replaced by the final source. */
  isDraft?: boolean;
  questions?: DrivingQuestion[];
  createdAt: Date;
  updatedAt: Date;
  // Computed by the API
  questionCount?: number;
  /** Computed by the API for the current viewer (premium course not yet unlocked). */
  locked?: boolean;
}

// Exam Types
export interface ExamQuestion {
  id: string;
  examId: string;
  questionId: string;
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

/** One question's full correction, returned by GET /exams/:id/results. */
export interface ExamCorrection {
  numero: number;
  questionId: string;
  enonce: string;
  image?: string | null;
  signalisation_visible?: string | null;
  category?: string | null;
  choices: string[];
  userAnswer?: string | null;
  correctAnswers: string[];
  isCorrect: boolean;
  explication: string;
}

export interface ExamResult {
  id: string;
  userId: string;
  examId: string;
  score: number;
  percentage: number;
  passed: boolean;
  timeUsed: number;
  totalTime: number;
  totalQuestions?: number;
  startedAt: Date;
  completedAt: Date;
  questions: ExamQuestion[];
  /** XP awarded for this exam (approx). Computed by the API. */
  xpEarned?: number;
  /** Per-category success rate, keyed by category label. Computed by the API. */
  categoryBreakdown?: Record<string, number>;
  /** Full per-question correction with explanations. Computed by the API. */
  corrections?: ExamCorrection[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Exam {
  id: string;
  userId: string;
  status: 'pending' | 'in_progress' | 'completed';
  duration: number;
  startedAt?: Date;
  completedAt?: Date;
  result?: ExamResult;
  createdAt: Date;
  updatedAt: Date;
}

// Progress Types
export interface Progress {
  id: string;
  userId: string;
  serieId: string;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  createdAt: Date;
  updatedAt: Date;
}

// Statistic Types
export interface Statistic {
  id: string;
  userId: string;
  categoryId?: string;
  correctAnswers: number;
  totalAnswers: number;
  successRate: number;
  averageTime: number;
  createdAt: Date;
  updatedAt: Date;
}

// Favorite Types
export interface Favorite {
  id: string;
  userId: string;
  lessonId?: string;
  questionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Badge Types
export interface Badge {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Alias used by the gamification store
export type BadgeType = Badge;

// User profile returned by GET /profile (same shape as User)
export type UserProfile = User;

// Daily Streak Types
export interface DailyStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Traffic Sign Types
export interface TrafficSign {
  id: string;
  code?: string;
  name: string;
  meaning: string;
  category: 'Danger' | 'Interdiction' | 'Obligation' | 'Priorité' | 'Indication' | 'Direction' | 'Temporaire' | 'Restriction' | 'Stationnement';
  description: string;
  contexte_usage?: string;
  regle_associee?: string;
  icone?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Boutique / Premium (Sprint 6) ────────────────────────────────────────────

export type ProductKind = 'PACK' | 'EXAM';
export type PurchaseStatus = 'PENDING' | 'PAID' | 'FAILED';

/**
 * Two distinct axes, do not conflate:
 * - `PaymentProviderId` = which back-end adapter handles the charge (routing).
 *   `bictorys` aggregates all real methods; `sandbox` is the offline dev fake.
 * - `PaymentMethod` = what the user picked in the UI. All methods route through
 *   Bictorys; `card` uses its hosted checkout page (redirect), the rest are
 *   Mobile Money (direct).
 */
export type PaymentProviderId = 'bictorys' | 'sandbox';
export type PaymentMethod = 'orange_money' | 'wave' | 'card';

/**
 * Entitlement keys. `exam:<templateId>` is dynamic (per-unit exam purchase);
 * the rest are fixed pack/global grants.
 */
export type EntitlementKey =
  | 'premium_all'
  | 'pack_quiz'
  | 'pack_exams'
  | 'pack_formation'
  | `exam:${string}`;

/** "Examen Blanc 1..N" catalog entry — gates and prices an exam. */
export interface ExamTemplate {
  id: string;
  numero: number;
  title: string;
  description: string;
  isFree: boolean;
  priceXof: number;
  questionCount: number;
  ordre: number;
  createdAt: Date;
  updatedAt: Date;
  /** Computed by the API for the current viewer. */
  locked?: boolean;
}

/** A sellable item: the annual subscription. */
export interface Product {
  id: string;
  sku: string;
  kind: ProductKind;
  title: string;
  description: string;
  priceXof: number;
  grants: string[];
  /** Grant duration in days when purchased; null/undefined = permanent. */
  validityDays?: number | null;
  active: boolean;
  ordre: number;
  createdAt: Date;
  updatedAt: Date;
  /** Computed by the API: the current user already owns all of this product's grants. */
  owned?: boolean;
}

export interface Purchase {
  id: string;
  userId: string;
  productId: string;
  provider: PaymentProviderId;
  /** The Mobile Money / card method the user chose at checkout. */
  method?: PaymentMethod | null;
  providerRef?: string | null;
  phone: string;
  amountXof: number;
  status: PurchaseStatus;
  createdAt: Date;
  updatedAt: Date;
  // Optionally included by the API
  product?: Pick<Product, 'id' | 'sku' | 'title' | 'kind' | 'priceXof'>;
}

export interface Entitlement {
  id: string;
  userId: string;
  key: string;
  source: 'purchase' | 'seed' | 'admin';
  purchaseId?: string | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
