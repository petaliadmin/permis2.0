'use client';

import { motion } from 'framer-motion';
import { SearchX, FileWarning, ClipboardX, FileStack, Sparkles, type LucideIcon } from 'lucide-react';

interface Problem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PROBLEMS: Problem[] = [
  {
    icon: SearchX,
    title: 'Difficile de trouver une bonne auto-école',
    description: 'Bouche-à-oreille, aucun moyen fiable de comparer avant de s\'engager.',
  },
  {
    icon: FileWarning,
    title: "Peu d'informations fiables",
    description: 'Prix, taux de réussite, moniteurs : tout reste flou avant de s\'inscrire.',
  },
  {
    icon: ClipboardX,
    title: 'Gestion administrative compliquée',
    description: 'Paiements en liquide, dossiers papier, suivi manuel des élèves.',
  },
  {
    icon: FileStack,
    title: 'Suivi papier, aucune visibilité',
    description: "Impossible de savoir où on en est dans sa formation, en temps réel.",
  },
];

export function ProblemSolution() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-2xl text-center"
      >
        <span className="chip chip-danger">Le constat</span>
        <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Pourquoi Permis2 ?
        </h2>
        <p className="mt-3 text-base text-secondary">
          Obtenir son permis au Sénégal reste un parcours flou et administratif. On a décidé de le
          simplifier, de bout en bout.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {PROBLEMS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="card flex items-start gap-4"
          >
            <span className="chip-danger flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
              <p.icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="font-display text-base font-bold text-foreground">{p.title}</p>
              <p className="mt-1 text-sm text-secondary">{p.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8 flex flex-col items-center gap-3 rounded-3xl bg-gradient-primary px-6 py-6 text-center text-white sm:flex-row sm:justify-center sm:text-left"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <Sparkles className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <p className="font-display text-lg font-extrabold">
          La solution : une seule plateforme, du premier clic à l&apos;examen.
        </p>
      </motion.div>
    </section>
  );
}
