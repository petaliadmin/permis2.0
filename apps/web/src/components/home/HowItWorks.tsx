'use client';

import { motion } from 'framer-motion';
import { UserPlus, School, Send, BadgeCheck, GraduationCap, type LucideIcon } from 'lucide-react';

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  { icon: UserPlus, title: 'Je crée un compte', description: "Inscription gratuite en moins d'une minute." },
  { icon: School, title: 'Je choisis une auto-école', description: 'Comparez, filtrez, et trouvez la vôtre.' },
  { icon: Send, title: "J'envoie une pré-inscription", description: 'En quelques clics, sans vous déplacer.' },
  { icon: BadgeCheck, title: 'Validation', description: "L'auto-école confirme votre inscription." },
  { icon: GraduationCap, title: 'Je commence ma formation', description: "Suivez votre progression jusqu'au jour J." },
];

export function HowItWorks() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="chip chip-violet">Le parcours</span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            Comment ça marche
          </h2>
        </motion.div>

        <div className="relative mt-14">
          <div className="absolute left-6 top-6 hidden h-[calc(100%-3rem)] w-px bg-token sm:block lg:left-1/2 lg:top-8 lg:h-px lg:w-[calc(100%-4rem)] lg:-translate-x-1/2" />

          <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-5 lg:gap-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="relative flex items-start gap-4 lg:flex-col lg:items-center lg:text-center"
              >
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary font-display text-base font-extrabold text-white shadow-glow">
                  {i + 1}
                </span>
                <div className="lg:mt-3">
                  <s.icon className="mx-auto mb-1.5 hidden h-5 w-5 text-primary-600 lg:block" strokeWidth={2} />
                  <p className="font-display text-sm font-bold text-foreground">{s.title}</p>
                  <p className="mt-1 text-xs text-secondary">{s.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
