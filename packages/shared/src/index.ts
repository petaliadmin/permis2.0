// Constants
export const APP_NAME = 'PERMIS2.0';

// Subscription pricing — single source of truth for the annual plan
export const SUBSCRIPTION_PRICE_XOF = 2900;
/** Formatted label: "2 900 FCFA" */
export const SUBSCRIPTION_PRICE_LABEL = `${SUBSCRIPTION_PRICE_XOF.toLocaleString('fr-FR')} FCFA`;
/** Short label used in banners: "2 900 FCFA/an" */
export const SUBSCRIPTION_PRICE_ANNUAL = `${SUBSCRIPTION_PRICE_XOF.toLocaleString('fr-FR')} FCFA/an`;
export const APP_SLOGAN = 'Réussissez votre permis du premier coup.';
export const APP_VERSION = '1.0.0';

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
  questionCount: 25,
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
