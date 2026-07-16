'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  /** Whether the dark class is currently applied (resolved from theme + system). */
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  /** Apply the current/persisted theme to <html>. Call once on mount. */
  applyTheme: () => void;
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveDark(theme: ThemeMode): boolean {
  return theme === 'dark' || (theme === 'system' && systemPrefersDark());
}

function applyClass(isDark: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', isDark);
}

/**
 * Theme store (Sprint 7). The app ships Tailwind `darkMode: 'class'` but nothing
 * toggled the `dark` class — this store owns that, persisted in localStorage so
 * the choice survives reloads. The Paramètres page drives `setTheme`.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      isDark: false,

      setTheme: (theme) => {
        const isDark = resolveDark(theme);
        applyClass(isDark);
        set({ theme, isDark });
      },

      applyTheme: () => {
        const isDark = resolveDark(get().theme);
        applyClass(isDark);
        set({ isDark });
      },
    }),
    {
      name: 'theme-store',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
