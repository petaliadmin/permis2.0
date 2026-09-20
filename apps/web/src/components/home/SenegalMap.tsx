'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, useInView } from 'framer-motion';
import type { School } from '@permis2.0/types';
import { Skeleton } from '@permis2.0/ui';
import { API_URL } from '@/lib/dataSource';

// Google Maps needs `window` — never rendered during SSR.
const SchoolsMap = dynamic(() => import('@/components/SchoolsMap').then((m) => m.SchoolsMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full min-h-[360px] w-full" />,
});

export function SenegalMap() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  // Lot 1.8 (SEO brief) — this section sits well below the fold; mounting
  // SchoolsMap unconditionally fetched Leaflet's JS/CSS and tile images on
  // every home page load regardless of whether the visitor ever scrolled
  // this far. `mapRef`/`mapInView` delay mounting it (and therefore
  // fetching its chunk) until the section is about to enter the viewport.
  const mapRef = useRef(null);
  const mapInView = useInView(mapRef, { once: true, margin: '200px' });

  useEffect(() => {
    if (!mapInView) return;
    fetch(`${API_URL}/schools?take=100`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSchools(Array.isArray(data) ? data : []))
      .catch(() => setSchools([]))
      .finally(() => setLoading(false));
  }, [mapInView]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-2xl text-center"
      >
        <span className="chip chip-xp">Partout au Sénégal</span>
        <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Nos auto-écoles partenaires, près de chez vous
        </h2>
        <p className="mt-3 text-base text-secondary">
          Dakar, Thiès, Saint-Louis, Kaolack, Ziguinchor… retrouvez les auto-écoles disponibles sur
          la carte.
        </p>
      </motion.div>

      <motion.div
        ref={mapRef}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mt-10 h-[380px] overflow-hidden rounded-3xl border border-token shadow-card-lg"
      >
        {mapInView ? (
          <SchoolsMap schools={schools} />
        ) : (
          <Skeleton className="h-full min-h-[360px] w-full" />
        )}
      </motion.div>

      {!loading && (
        <div className="mt-6 text-center">
          <Link href="/ecoles" className="btn-ghost inline-flex">
            Explorer la carte complète →
          </Link>
        </div>
      )}
    </section>
  );
}
