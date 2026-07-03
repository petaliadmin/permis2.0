'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const MAX_HEARTS = 5;
/** One heart regenerates every 30 minutes. */
const REGEN_MS = 30 * 60 * 1000;

interface HeartsState {
  hearts: number;
  /** ISO string of the timestamp when the NEXT regen tick fires. Null = full. */
  nextRegenAt: string | null;

  /** Lose one heart. Returns the new heart count. */
  loseHeart: () => number;
  /** Add one heart (up to MAX_HEARTS). Used by regen tick. */
  gainHeart: () => void;
  /** Refill all hearts immediately (premium / after purchase). */
  refill: () => void;
  /**
   * Compute current hearts after applying any elapsed regen ticks.
   * Call this on mount so stale persisted state is fast-forwarded.
   */
  tick: () => void;
}

export const useHeartsStore = create<HeartsState>()(
  persist(
    (set, get) => ({
      hearts: MAX_HEARTS,
      nextRegenAt: null,

      loseHeart: () => {
        const { hearts, nextRegenAt } = get();
        const newHearts = Math.max(0, hearts - 1);
        // Start the regen timer only when we go from full to not-full.
        const nextRegen =
          newHearts < MAX_HEARTS && !nextRegenAt
            ? new Date(Date.now() + REGEN_MS).toISOString()
            : nextRegenAt;
        set({ hearts: newHearts, nextRegenAt: nextRegen });
        return newHearts;
      },

      gainHeart: () => {
        const { hearts } = get();
        const newHearts = Math.min(MAX_HEARTS, hearts + 1);
        const nextRegen =
          newHearts < MAX_HEARTS
            ? new Date(Date.now() + REGEN_MS).toISOString()
            : null;
        set({ hearts: newHearts, nextRegenAt: nextRegen });
      },

      refill: () => {
        set({ hearts: MAX_HEARTS, nextRegenAt: null });
      },

      tick: () => {
        const { hearts, nextRegenAt } = get();
        if (!nextRegenAt || hearts >= MAX_HEARTS) {
          set({ nextRegenAt: null });
          return;
        }
        const now = Date.now();
        const next = new Date(nextRegenAt).getTime();
        if (now < next) return; // nothing to do yet

        // How many ticks elapsed since the stored nextRegenAt?
        const elapsed = now - next;
        const extraTicks = Math.floor(elapsed / REGEN_MS);
        const totalRegen = 1 + extraTicks;

        const newHearts = Math.min(MAX_HEARTS, hearts + totalRegen);
        const newNext =
          newHearts < MAX_HEARTS
            ? new Date(next + totalRegen * REGEN_MS + REGEN_MS).toISOString()
            : null;
        set({ hearts: newHearts, nextRegenAt: newNext });
      },
    }),
    {
      name: 'hearts-store',
      partialize: (s) => ({ hearts: s.hearts, nextRegenAt: s.nextRegenAt }),
    }
  )
);
