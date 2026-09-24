'use client';

import { motion, AnimatePresence } from 'framer-motion';

/** Brief red vignette pulse shown when an answer is wrong, mirroring the
 *  green confetti burst shown on correct answers. */
export function WrongFlash({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, times: [0, 0.25, 1], ease: 'easeOut' }}
          className="pointer-events-none fixed inset-0 z-[200]"
          style={{
            boxShadow: 'inset 0 0 0 12px rgba(239,68,68,0.55), inset 0 0 80px 20px rgba(239,68,68,0.35)',
          }}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}

/** Shake keyframes to apply to the wrongly-selected option's animate prop. */
export const shakeAnimation = { x: [0, -8, 8, -8, 8, -4, 4, 0] };
export const shakeTransition = { duration: 0.45, ease: 'easeInOut' as const };
