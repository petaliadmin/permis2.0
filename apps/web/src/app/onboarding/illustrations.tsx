'use client';

import { motion } from 'framer-motion';

/**
 * Icon-composition illustrations for the onboarding slides — soft layered
 * blobs behind Tabler icons, no image assets. Mirrors how the rest of the app
 * favors a big emoji/icon inside a soft circle over photography (pack-ecole,
 * boutique headers) rather than introducing a new visual language.
 */

const pop = {
  hidden: { opacity: 0, scale: 0.7, y: 12 },
  show: (delay: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 20, delay },
  }),
};

export function SlideSignsIllustration() {
  return (
    <div className="relative flex h-56 w-56 items-center justify-center">
      <div className="absolute h-full w-full rounded-[40%] bg-white/10 blur-sm" />
      <motion.div
        custom={0.1}
        initial="hidden"
        animate="show"
        variants={pop}
        className="absolute -left-2 -top-2 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 backdrop-blur"
      >
        <i className="ti ti-triangle text-4xl text-white" aria-hidden="true" />
      </motion.div>
      <motion.div
        custom={0.25}
        initial="hidden"
        animate="show"
        variants={pop}
        className="absolute -right-4 top-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"
      >
        <i className="ti ti-circle-off text-3xl text-white" aria-hidden="true" />
      </motion.div>
      <motion.div
        custom={0}
        initial="hidden"
        animate="show"
        variants={pop}
        className="flex h-32 w-32 items-center justify-center rounded-[2.25rem] bg-white/20 shadow-lg backdrop-blur"
      >
        <i className="ti ti-road-sign text-6xl text-white" aria-hidden="true" />
      </motion.div>
      <motion.div
        custom={0.35}
        initial="hidden"
        animate="show"
        variants={pop}
        className="absolute -bottom-2 left-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"
      >
        <i className="ti ti-parking text-2xl text-white" aria-hidden="true" />
      </motion.div>
    </div>
  );
}

export function SlideQuizIllustration() {
  return (
    <div className="relative flex h-56 w-56 items-center justify-center">
      <div className="absolute h-full w-full rounded-[40%] bg-white/10 blur-sm" />
      <motion.div
        custom={0.15}
        initial="hidden"
        animate="show"
        variants={pop}
        className="absolute -left-4 top-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"
      >
        <i className="ti ti-clipboard-check text-3xl text-white" aria-hidden="true" />
      </motion.div>
      <motion.div
        custom={0}
        initial="hidden"
        animate="show"
        variants={pop}
        className="flex h-32 w-32 items-center justify-center rounded-[2.25rem] bg-white/20 shadow-lg backdrop-blur"
      >
        <i className="ti ti-cards text-6xl text-white" aria-hidden="true" />
      </motion.div>
      <motion.div
        custom={0.3}
        initial="hidden"
        animate="show"
        variants={pop}
        className="absolute -right-2 bottom-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"
      >
        <i className="ti ti-check text-3xl text-white" aria-hidden="true" />
      </motion.div>
    </div>
  );
}

export function SlideProgressIllustration() {
  return (
    <div className="relative flex h-56 w-56 items-center justify-center">
      <div className="absolute h-full w-full rounded-[40%] bg-white/10 blur-sm" />
      <motion.div
        custom={0.2}
        initial="hidden"
        animate="show"
        variants={pop}
        className="absolute -right-3 -top-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"
      >
        <i className="ti ti-chart-bar text-3xl text-white" aria-hidden="true" />
      </motion.div>
      <motion.div
        custom={0}
        initial="hidden"
        animate="show"
        variants={pop}
        className="flex h-32 w-32 items-center justify-center rounded-[2.25rem] bg-white/20 shadow-lg backdrop-blur"
      >
        <i className="ti ti-trophy text-6xl text-white" aria-hidden="true" />
      </motion.div>
      <motion.div
        custom={0.35}
        initial="hidden"
        animate="show"
        variants={pop}
        className="absolute -bottom-3 left-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"
      >
        <i className="ti ti-steering-wheel text-2xl text-white" aria-hidden="true" />
      </motion.div>
    </div>
  );
}
