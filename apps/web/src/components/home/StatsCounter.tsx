'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { School, Users, Star, MapPin, type LucideIcon } from 'lucide-react';
import type { PlatformStats } from './Hero';

interface StatDef {
  icon: LucideIcon;
  value: number;
  suffix: string;
  label: string;
}

// SEO audit finding (Étape 3/6, "compteurs qui s'animent depuis 0") — two
// bugs, not one: the values were hardcoded marketing copy, AND the counter
// always started its React state at 0 regardless of the value passed in,
// so even a real number would have rendered as "0" in the server HTML
// until client-side animation ran. Fixed by seeding `display` with the
// real `value` (below) instead of 0 — the count-up is a client-only
// enhancement layered on top of an already-correct server render, not the
// only way the number ever appears.
function buildStats(stats: PlatformStats): StatDef[] {
  const items: StatDef[] = [];
  if (stats.schoolsCount > 0) {
    items.push({ icon: School, value: stats.schoolsCount, suffix: '+', label: 'Auto-écoles' });
  }
  if (stats.studentsCount > 0) {
    items.push({ icon: Users, value: stats.studentsCount, suffix: '+', label: 'Élèves' });
  }
  if (stats.reviewCount > 0 && stats.averageRating != null) {
    items.push({
      icon: Star,
      value: Math.round(stats.averageRating * 10) / 10,
      suffix: '/5',
      label: `Note moyenne (${stats.reviewCount} avis)`,
    });
  }
  if (stats.citiesCount > 0) {
    items.push({ icon: MapPin, value: stats.citiesCount, suffix: '', label: 'Villes couvertes' });
  }
  return items;
}

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  // Seeded with the real value, not 0 — see the note above buildStats().
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();

    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased * 10) / 10);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {display.toLocaleString('fr-FR')}
      {suffix}
    </span>
  );
}

export function StatsCounter({ stats }: { stats: PlatformStats }) {
  const STATS = buildStats(stats);
  if (STATS.length === 0) return null;
  return (
    <section className="bg-gradient-to-b from-primary-50 to-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="text-center"
            >
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-soft">
                <s.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="mt-3 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
                <Counter value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-sm text-secondary">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
