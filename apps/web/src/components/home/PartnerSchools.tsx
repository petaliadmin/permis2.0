'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { School } from '@permis2.0/types';
import { SchoolCard } from '@/components/SchoolCard';

interface PartnerSchoolsProps {
  /** Fetched server-side (app/page.tsx) so the real school names/links are
   *  in the initial server HTML — a client-only fetch would leave this
   *  section's content (and its links to /ecoles/[slug]) invisible without
   *  JS. Paid/featured schools first (server-ordered), remaining slots
   *  filled randomly. */
  initialSchools: School[];
}

export function PartnerSchools({ initialSchools }: PartnerSchoolsProps) {
  // Only empty when there are no active schools at all yet.
  if (initialSchools.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <h2 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
          Top 20 des auto-écoles
        </h2>
        <Link href="/ecoles" className="text-sm font-bold text-primary-600 hover:underline">
          Voir toutes les auto-écoles →
        </Link>
      </motion.div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialSchools.map((s) => (
          <SchoolCard key={s.id} school={s} compact />
        ))}
      </div>
    </section>
  );
}
