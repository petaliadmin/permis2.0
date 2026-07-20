'use client';

/**
 * Local bank of quiz questions answered incorrectly, so the user can review
 * them later ("Revoir mes erreurs"). Stored in localStorage; a question leaves
 * the bank once it is answered correctly (in review or in a normal quiz).
 */

export interface ErrorItem {
  id: string;
  categorie: string;
  enonce: string;
  options: string[];
  bonneReponse: string;
  explication?: string;
  image?: string;
  signalisation_visible?: string;
  /** Timestamp of the last failed attempt. */
  failedAt: number;
}

const KEY = 'quizz_errors';
const MAX_ITEMS = 200;

export function getErrors(): ErrorItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? (raw as ErrorItem[]) : [];
  } catch {
    return [];
  }
}

export function countErrors(): number {
  return getErrors().length;
}

export function addError(q: Omit<ErrorItem, 'failedAt'>): void {
  try {
    const items = getErrors().filter((e) => e.id !== q.id);
    items.unshift({ ...q, failedAt: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {}
}

export function removeError(id: string): void {
  try {
    const items = getErrors().filter((e) => e.id !== id);
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}
