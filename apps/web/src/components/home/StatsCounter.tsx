'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { School, Users, Smile, MapPin, type LucideIcon } from 'lucide-react';

interface StatDef {
  icon: LucideIcon;
  value: number;
  suffix: string;
  label: string;
}

const STATS: StatDef[] = [
  { icon: School, value: 300, suffix: '+', label: 'Auto-écoles' },
  { icon: Users, value: 20000, suffix: '+', label: 'Élèves' },
  { icon: Smile, value: 95, suffix: '%', label: 'Satisfaction' },
  { icon: MapPin, value: 150, suffix: '+', label: 'Villes couvertes' },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();

    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
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

export function StatsCounter() {
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
