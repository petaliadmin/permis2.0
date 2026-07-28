'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { School } from '@permis2.0/types';
import { Skeleton } from '@permis2.0/ui';
import { API_URL } from '@/lib/dataSource';
import { SchoolCard } from '@/components/SchoolCard';

export function PartnerSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/schools?take=6`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSchools(Array.isArray(data) ? data : []))
      .catch(() => setSchools([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && schools.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <h2 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
          Auto-écoles partenaires
        </h2>
        <Link href="/ecoles" className="text-sm font-bold text-primary-600 hover:underline">
          Voir toutes les auto-écoles →
        </Link>
      </motion.div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          : schools.map((s) => <SchoolCard key={s.id} school={s} compact />)}
      </div>
    </section>
  );
}
