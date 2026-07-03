'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#16A34A', '#FACC15', '#22c55e', '#fde047', '#4ade80'];

export interface ConfettiProps {
  /** Number of particles. Default 24. */
  count?: number;
  /** Remount key — change it to re-fire the burst (e.g. the question id). */
  burstKey?: string | number;
}

/**
 * Lightweight confetti burst for correct-answer celebrations. Pure
 * framer-motion (no extra dependency). Particles fan out from the top-center
 * and fall; the whole burst lasts ~1.6s. Pointer-events-none so it never
 * blocks taps. Hidden from assistive tech (decorative).
 *
 * To re-fire on each correct answer, pass a changing `burstKey` and render it
 * conditionally; React remounts it and the animation replays.
 */
export function Confetti({ count = 24, burstKey }: ConfettiProps) {
  // Precompute per-particle trajectories once per mount. Deterministic-ish via
  // index so we avoid layout thrash; spread is wide enough to feel celebratory.
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI - Math.PI / 2; // -90°..+90°
        const distance = 120 + (i % 5) * 40;
        return {
          id: i,
          color: COLORS[i % COLORS.length],
          x: Math.cos(angle) * distance,
          y: 220 + (i % 7) * 30,
          rotate: (i % 2 === 0 ? 1 : -1) * (180 + i * 12),
          delay: (i % 6) * 0.03,
        };
      }),
    [count]
  );

  return (
    <div
      key={burstKey}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-1/4 z-50 flex justify-center overflow-visible"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rotate, scale: 0.6 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: p.delay }}
          className="absolute h-2.5 w-2.5 rounded-[2px]"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}
