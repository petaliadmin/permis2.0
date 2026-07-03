'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Wraps page content in a per-route horizontal slide so navigating between
 * screens feels like a native navigation stack (new screen slides in from the
 * right, old one eases out to the left) rather than a browser reload.
 * Keyed on the pathname so AnimatePresence runs the exit/enter on every route
 * change. Duration stays in the 200–300 ms band from the design brief, and
 * framer-motion automatically reduces motion when the OS setting is on.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
