'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Wraps page content in a per-route fade + subtle slide so navigating between
 * screens feels like an app transition rather than a hard browser reload.
 * Keyed on the pathname so AnimatePresence runs the exit/enter on every route
 * change. Respects users who prefer reduced motion (framer-motion does this
 * automatically when the OS setting is on).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
