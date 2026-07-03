/**
 * Vibration API wrapper for native-feel haptic feedback.
 * No-ops gracefully in browsers without support (desktop, iOS Safari).
 *
 * Patterns follow Material Design / Duolingo conventions:
 *   correct  → short single pulse (success)
 *   wrong    → double pulse (error)
 *   tap      → minimal tick (button press)
 *   heavy    → long pulse (achievement)
 */

function vibrate(pattern: number | number[]): void {
  if (typeof window === 'undefined') return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported — silent */
  }
}

export const haptic = {
  tap: () => vibrate(10),
  correct: () => vibrate(60),
  wrong: () => vibrate([40, 60, 40]),
  heavy: () => vibrate(120),
  levelUp: () => vibrate([80, 50, 80, 50, 120]),
} as const;

export function useHaptic() {
  return haptic;
}
