'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { HOME_FAQS as FAQS } from '@/lib/homeFaq';

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <span className="chip chip-primary">FAQ</span>
        <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Questions fréquentes
        </h2>
      </motion.div>

      <div className="mt-10 space-y-3">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.question} className="overflow-hidden rounded-2xl border border-token bg-surface-1">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <h3 className="font-display text-sm font-bold text-foreground sm:text-base">
                  {item.question}
                </h3>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  strokeWidth={2}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm text-secondary">{item.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
