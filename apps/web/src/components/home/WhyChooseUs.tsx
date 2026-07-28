'use client';

import { motion } from 'framer-motion';
import {
  Clock,
  GitCompare,
  CreditCard,
  LineChart,
  MapPinned,
  Headset,
  ShieldCheck,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';

interface Benefit {
  icon: LucideIcon;
  title: string;
  accent: string;
}

const BENEFITS: Benefit[] = [
  { icon: Clock, title: 'Gain de temps', accent: 'chip-primary' },
  { icon: GitCompare, title: 'Comparaison facile', accent: 'chip-violet' },
  { icon: CreditCard, title: 'Paiement simplifié', accent: 'chip-orange' },
  { icon: LineChart, title: 'Suivi numérique', accent: 'chip-success' },
  { icon: MapPinned, title: 'Disponible partout au Sénégal', accent: 'chip-xp' },
  { icon: Headset, title: 'Support réactif', accent: 'chip-primary' },
  { icon: ShieldCheck, title: 'Sécurité des données', accent: 'chip-success' },
  { icon: LayoutGrid, title: 'Interface intuitive', accent: 'chip-violet' },
];

export function WhyChooseUs() {
  return (
    <section className="bg-surface-1 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="chip chip-success">Pourquoi Permis2</span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            Pensé pour vous simplifier la vie
          </h2>
        </motion.div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="card text-center"
            >
              <span className={`chip ${b.accent} mx-auto flex h-11 w-11 items-center justify-center !rounded-2xl`}>
                <b.icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <p className="mt-3 font-display text-sm font-bold text-foreground">{b.title}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
