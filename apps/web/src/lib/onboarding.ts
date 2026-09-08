'use client';

/**
 * First-run + intended-profile flags. Stored as cookies scoped to the parent
 * domain so they are shared across the www / learn / school subdomains
 * (localStorage is per-origin and would make the user redo onboarding on each
 * subdomain). localStorage is still written as a fallback and read for
 * backward compatibility with accounts onboarded before the split.
 */

export type ProfileChoice = 'PARTICULIER' | 'AUTO_ECOLE';

const ONE_YEAR = 60 * 60 * 24 * 365;
const DONE_KEY = 'permis_onboarding_done';
const PROFILE_KEY = 'intended_profile_type';

function cookieDomain(): string {
  const h = window.location.hostname;
  if (h === 'localhost' || h.endsWith('.localhost')) return 'localhost';
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) return h;
  const parts = h.split('.');
  if (parts.length > 2) parts.shift(); // drop www/learn/school label
  return '.' + parts.join('.');
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${ONE_YEAR}; domain=${cookieDomain()}; samesite=lax`;
}

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function markOnboardingDone(profile: ProfileChoice): void {
  writeCookie(DONE_KEY, '1');
  writeCookie(PROFILE_KEY, profile);
  try {
    localStorage.setItem(DONE_KEY, '1');
    localStorage.setItem(PROFILE_KEY, profile);
  } catch {
    /* ignore */
  }
}

export function isOnboardingDone(): boolean {
  if (readCookie(DONE_KEY) === '1') return true;
  try {
    return localStorage.getItem(DONE_KEY) === '1';
  } catch {
    return false;
  }
}

export function getIntendedProfile(): ProfileChoice | null {
  const c = readCookie(PROFILE_KEY);
  if (c === 'PARTICULIER' || c === 'AUTO_ECOLE') return c;
  try {
    const l = localStorage.getItem(PROFILE_KEY);
    return l === 'PARTICULIER' || l === 'AUTO_ECOLE' ? l : null;
  } catch {
    return null;
  }
}
