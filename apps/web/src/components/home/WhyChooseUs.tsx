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
  description: string;
  accent: string;
}

const BENEFITS: Benefit[] = [
  {
    icon: Clock,
    title: 'Gain de temps',
    description: 'Inscription, paiement et suivi en ligne — fini les allers-retours.',
    accent: 'chip-primary',
  },
  {
    icon: GitCompare,
    title: 'Comparaison facile',
    description: 'Prix, avis et taux de réussite côte à côte avant de vous engager.',
    accent: 'chip-violet',
  },
  {
    icon: CreditCard,
    title: 'Paiement simplifié',
    description: 'Réglez en ligne ou par WhatsApp, avec un reçu à chaque fois.',
    accent: 'chip-orange',
  },
  {
    icon: LineChart,
    title: 'Suivi numérique',
    description: 'Visualisez votre progression en temps réel jusqu’au jour J.',
    accent: 'chip-success',
  },
  {
    icon: MapPinned,
    title: 'Partout au Sénégal',
    description: 'Des auto-écoles de Dakar à Ziguinchor, sur une seule carte.',
    accent: 'chip-xp',
  },
  {
    icon: Headset,
    title: 'Support réactif',
    description: 'Une équipe joignable par WhatsApp quand vous en avez besoin.',
    accent: 'chip-primary',
  },
  {
    icon: ShieldCheck,
    title: 'Données sécurisées',
    description: 'Vos informations et paiements protégés, jamais revendus.',
    accent: 'chip-success',
  },
  {
    icon: LayoutGrid,
    title: 'Interface intuitive',
    description: 'Pensée pour le mobile, simple à prendre en main dès la première visite.',
    accent: 'chip-violet',
  },
];

export function WhyChooseUs() {
  return (
    <section className="bg-surface-1 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="chip chip-success">Pourquoi PERMIS2.0</span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            Pensé pour vous simplifier la vie
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: Math.min(i, 4) * 0.05 }}
              className="card"
            >
              <span className={`chip ${b.accent} flex h-11 w-11 items-center justify-center !rounded-2xl`}>
                <b.icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <h3 className="mt-3 font-display text-base font-bold text-foreground">{b.title}</h3>
              <p className="mt-1 text-sm text-secondary">{b.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
