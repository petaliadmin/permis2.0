// Constants
export const APP_NAME = 'PERMIS2.0';
export const APP_SLOGAN = 'Réussissez votre permis du premier coup.';

// Colors
export const COLORS = {
  primary: '#16A34A',
  secondary: '#FACC15',
  danger: '#DC2626',
  dark: '#111827',
  background: '#FFFFFF',
};

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Exam Configuration
export const EXAM_CONFIG = {
  duration: 30 * 60 * 1000, // 30 minutes
  questionCount: 40,
  passingScore: 70,
};

// Series Configuration
export const SERIES_CONFIG = {
  questionCount: 25,
  codes: ['B1', 'B2', 'B3'] as const,
};

// Level Thresholds
export const LEVEL_CONFIG = {
  Débutant: 0,
  Intermédiaire: 100,
  Confirmé: 300,
  Expert: 600,
} as const;

// XP Configuration
export const XP_CONFIG = {
  correctAnswer: 10,
  perfectSeries: 50,
  dailyBonus: 20,
  streakMultiplier: 1.5,
} as const;
