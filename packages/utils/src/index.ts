// Formatting utilities
export function formatPercentage(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Score utilities
export function calculateScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function getScoreLabel(score: number): 'Excellent' | 'Bon' | 'Moyen' | 'Faible' {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'Moyen';
  return 'Faible';
}

// XP utilities
export const XP_RULES = {
  correctAnswer: 10,
  perfectSeries: 50,
  dailyBonus: 20,
  streakMultiplier: 1.5,
};

export function calculateXP(
  correct: number,
  total: number,
  streakBonus: number = 1
): number {
  let xp = correct * XP_RULES.correctAnswer;
  if (correct === total) {
    xp += XP_RULES.perfectSeries;
  }
  return Math.round(xp * streakBonus);
}

// Level utilities
export const LEVEL_THRESHOLDS = {
  Débutant: 0,
  Intermédiaire: 100,
  Confirmé: 300,
  Expert: 600,
};

export function getLevelFromXP(xp: number): 'Débutant' | 'Intermédiaire' | 'Confirmé' | 'Expert' {
  if (xp >= LEVEL_THRESHOLDS.Expert) return 'Expert';
  if (xp >= LEVEL_THRESHOLDS.Confirmé) return 'Confirmé';
  if (xp >= LEVEL_THRESHOLDS.Intermédiaire) return 'Intermédiaire';
  return 'Débutant';
}

export function getNextLevelThreshold(currentXP: number): number {
  const levels = Object.values(LEVEL_THRESHOLDS).sort((a, b) => a - b);
  for (const threshold of levels) {
    if (currentXP < threshold) {
      return threshold;
    }
  }
  return LEVEL_THRESHOLDS.Expert + 1000;
}

export function getProgressToNextLevel(currentXP: number): number {
  const nextLevel = getNextLevelThreshold(currentXP);
  const levels = Object.values(LEVEL_THRESHOLDS).sort((a, b) => a - b);
  let currentLevelThreshold = 0;
  for (const threshold of levels) {
    if (currentXP >= threshold) {
      currentLevelThreshold = threshold;
    }
  }
  return Math.round(((currentXP - currentLevelThreshold) / (nextLevel - currentLevelThreshold)) * 100);
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

// Array utilities
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Object utilities
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    const sourceValue = source[key];
    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      result[key] = deepMerge(result[key] as any || {}, sourceValue as any) as any;
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as any;
    }
  }
  return result;
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Constants
export const EXAM_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
export const EXAM_PASSING_SCORE = 70; // 70%
export const EXAM_QUESTION_COUNT = 40;
export const SERIES_QUESTION_COUNT = 25;
export const SERIES_CODES = ['B1', 'B2', 'B3'] as const;
