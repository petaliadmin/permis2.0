'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  /** Play feedback sounds in quizzes (correct/incorrect answers). */
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

/**
 * User preferences that are purely local to the device (no account needed).
 * Persisted in localStorage so they survive reloads.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
    }),
    { name: 'settings-store' }
  )
);
