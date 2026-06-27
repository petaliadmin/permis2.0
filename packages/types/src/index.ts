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
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
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

export interface ExamResult {
  id: string;
  userId: string;
  examId: string;
  score: number;
  percentage: number;
  passed: boolean;
  timeUsed: number;
  totalTime: number;
  startedAt: Date;
  completedAt: Date;
  questions: ExamQuestion[];
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
