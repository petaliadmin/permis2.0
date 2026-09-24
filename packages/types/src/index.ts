export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum ProfileType {
  PARTICULIER = 'PARTICULIER',
  AUTO_ECOLE = 'AUTO_ECOLE',
}

export interface User {
  id: string;
  email?: string | null;
  phone?: string | null;
  name: string;
  avatar?: string | null;
  xp: number;
  level: string;
  role: Role;
  profileType: ProfileType;
  currentStreak?: number;
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
  category:
    | 'Danger'
    | 'Interdiction'
    | 'Obligation'
    | 'Priorité'
    | 'Indication'
    | 'Direction'
    | 'Temporaire'
    | 'Restriction'
    | 'Stationnement';
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

// ─── Abonnements standard : élève / auto-école / mise en avant ───────────────

export type SubscriptionType = 'STUDENT' | 'SCHOOL' | 'SCHOOL_FEATURED';
export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'CANCELLED';
/** The channel used to pay/activate. Orange Money / Card stay UI-disabled for now. */
export type SubscriptionPaymentMethod = 'ORANGE_MONEY' | 'CARD' | 'WHATSAPP' | 'ADMIN';

/**
 * Entitlement keys. Only `premium_all` is ever actually granted today (a
 * single student tier) — the rest exist for forward-compatibility with a
 * future per-pack plan.
 */
export type EntitlementKey =
  | 'premium_all'
  | 'pack_quiz'
  | 'pack_exams'
  | 'pack_formation'
  | `exam:${string}`;

/** A sellable subscription tier — élève, auto-école, ou mise en avant "Top 20". */
export interface SubscriptionPlan {
  id: string;
  type: SubscriptionType;
  title: string;
  description?: string | null;
  priceXof: number;
  durationDays: number;
  active: boolean;
  ordre: number;
  createdAt: Date;
  updatedAt: Date;
}

/** A subscription request/grant — one row per request, so renewals form a real ledger. */
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  /** Set for school-scoped plans (SCHOOL, SCHOOL_FEATURED). */
  schoolId?: string | null;
  status: SubscriptionStatus;
  paymentMethod: SubscriptionPaymentMethod;
  amountXof: number;
  startDate?: Date | null;
  endDate?: Date | null;
  requestedAt: Date;
  confirmedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Optionally included by the API
  plan?: Pick<SubscriptionPlan, 'id' | 'title' | 'type'>;
  school?: { id: string; name: string } | null;
}

// ─── Multi-tenant : auto-écoles — Phase 0 fondations ─────────────────────────
// `Role`, `ProfileType` and `User` above are the platform-level axis and stay
// untouched. Everything below is a separate, tenant-scoped RBAC axis.

export enum SchoolStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum SchoolMemberRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  SECRETARY = 'SECRETARY',
  INSTRUCTOR = 'INSTRUCTOR',
  COACH = 'COACH',
  ACCOUNTANT = 'ACCOUNTANT',
}

export enum SchoolEnrollmentStatus {
  SENT = 'SENT',
  IN_PROGRESS = 'IN_PROGRESS',
  ACCEPTED = 'ACCEPTED',
  REFUSED = 'REFUSED',
  CONFIRMED = 'CONFIRMED',
}

export enum SchoolStudentStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  GRADUATED = 'GRADUATED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface School {
  id: string;
  slug: string;
  name: string;
  status: SchoolStatus;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  /** Free-form paragraph the school writes about itself, shown on its public fiche. */
  description?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  openingHours?: Record<string, string> | null;
  services: string[];
  licenseCategories: string[];
  /** Starting price shown on cards/search — derived server-side from the minimum of pricesByCategory. */
  priceXof?: number | null;
  /** Price in FCFA per licenseCategories code, e.g. { "A": 80000, "B": 150000 }. */
  pricesByCategory?: Record<string, number> | null;
  /** Platform access gate — /mon-ecole requires this to be in the future. */
  subscriptionExpiresAt?: Date | null;
  /** End of the one-time free trial, set once at creation. subscriptionExpiresAt
   * === trialEndsAt means no purchase has ever extended past the original trial. */
  trialEndsAt?: Date | null;
  /** While in the future, the school appears in the homepage "Top 20" list. */
  featuredUntil?: Date | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: Date;
  updatedAt: Date;
  /** Computed by the API for the current viewer. */
  myRole?: SchoolMemberRole | null;
  /** Computed by the API: count of ACTIVE SchoolStudent rattachements. */
  studentsCount?: number;
}

/** GET /schools/:id/reviews (Lot 5). */
export interface SchoolReview {
  id: string;
  schoolId: string;
  userId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string };
}

export interface SchoolReviewsResponse {
  reviews: SchoolReview[];
  /** null while no review exists yet — never a placeholder. */
  averageRating: number | null;
  reviewCount: number;
}

export interface SchoolMembership {
  id: string;
  schoolId: string;
  userId?: string | null;
  /** Set only when userId is null — a staff member added without a PERMIS 2.0 account yet. */
  guestName?: string | null;
  guestPhone?: string | null;
  role: SchoolMemberRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: Pick<User, 'id' | 'name' | 'phone' | 'email'> | null;
}

/** A student pre-registration lead for a school. */
export interface SchoolEnrollmentRequest {
  id: string;
  schoolId: string;
  studentUserId?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  city?: string | null;
  licenseCategory?: string | null;
  message?: string | null;
  status: SchoolEnrollmentStatus;
  statusNote?: string | null;
  respondedByUserId?: string | null;
  respondedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** Included by GET /schools/my-requests. */
  school?: Pick<School, 'id' | 'slug' | 'name' | 'city' | 'district' | 'logoUrl'>;
}

/** A confirmed student <-> school rattachement. */
export interface SchoolStudent {
  id: string;
  schoolId: string;
  userId?: string | null;
  /** Set only when userId is null — a student added without a PERMIS 2.0 account yet. */
  guestName?: string | null;
  guestPhone?: string | null;
  enrollmentRequestId?: string | null;
  licenseCategory?: string | null;
  status: SchoolStudentStatus;
  enrolledAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: Pick<User, 'id' | 'name' | 'phone' | 'email'> | null;
  /** Included by GET /schools/my-enrollments. */
  school?: Pick<School, 'id' | 'slug' | 'name' | 'city' | 'district' | 'logoUrl'>;
  assignedInstructorMembershipId?: string | null;
  assignedVehicleId?: string | null;
  assignedInstructor?: SchoolPersonRef | null;
  assignedVehicle?: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'> | null;
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export interface Vehicle {
  id: string;
  schoolId: string;
  plate: string;
  brand?: string | null;
  model?: string | null;
  category?: string | null;
  status: VehicleStatus;
  insuranceExpiresAt?: Date | null;
  technicalInspectionExpiresAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Computed by the API: expiry within 30 days (or already past). */
  insuranceExpiringSoon?: boolean;
  inspectionExpiringSoon?: boolean;
}

export enum SessionType {
  THEORY = 'THEORY',
  PRACTICE = 'PRACTICE',
}

export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface Session {
  id: string;
  schoolId: string;
  studentId: string;
  type: SessionType;
  status: SessionStatus;
  startsAt: Date;
  endsAt: Date;
  instructorMembershipId?: string | null;
  vehicleId?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  school?: Pick<School, 'id' | 'slug' | 'name' | 'city' | 'district' | 'logoUrl'>;
  student?: SchoolPersonRef;
  instructor?: SchoolPersonRef | null;
  vehicle?: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'> | null;
}

/** A student/instructor as embedded in Session/SchoolPayment — may be a guest (no `user`). */
export interface SchoolPersonRef {
  id: string;
  user?: Pick<User, 'id' | 'name' | 'phone' | 'email'> | null;
  guestName?: string | null;
  guestPhone?: string | null;
}

export enum SchoolPaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum SchoolPaymentType {
  DEVIS = 'DEVIS',
  FACTURE = 'FACTURE',
}

export interface SchoolPaymentItem {
  label: string;
  qty: number;
  unitPriceXof: number;
}

export interface SchoolPayment {
  id: string;
  schoolId: string;
  studentId: string;
  type: SchoolPaymentType;
  /** Sequential reference, e.g. "F-2026-0001" / "D-2026-0001". */
  number?: string | null;
  amountXof: number;
  description: string;
  items?: SchoolPaymentItem[] | null;
  notes?: string | null;
  status: SchoolPaymentStatus;
  method?: string | null;
  dueDate?: Date | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  school?: Pick<School, 'id' | 'slug' | 'name' | 'city' | 'district' | 'logoUrl'>;
  student?: SchoolPersonRef;
}
