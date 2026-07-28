'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { GitCompare, CalendarCheck, MessageCircle, CreditCard, LineChart, BellRing, FileText, type LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  label: string;
}

const FEATURES: Feature[] = [
  { icon: GitCompare, label: 'Comparer les auto-écoles' },
  { icon: CalendarCheck, label: 'Réserver ses séances' },
  { icon: MessageCircle, label: 'Discuter avec son auto-école' },
  { icon: CreditCard, label: 'Payer en ligne ou par WhatsApp' },
  { icon: LineChart, label: 'Suivre ses cours' },
  { icon: BellRing, label: 'Recevoir des rappels' },
  { icon: FileText, label: 'Accéder à ses documents' },
];

export function ForStudents() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative order-2 aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary-100 to-primary-200 shadow-card-lg dark:from-primary-900/30 dark:to-primary-800/20 lg:order-1"
        >
          <Image
            src="/images/home/for-students.jpg"
            alt="Jeune élève sénégalais utilisant l'application Permis2 sur son smartphone"
            fill
            sizes="(min-width: 1024px) 480px, 90vw"
            className="object-cover"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="order-1 lg:order-2"
        >
          <span className="chip chip-primary">Pour les élèves</span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            Votre formation, simplifiée du début à la fin
          </h2>
          <p className="mt-3 text-base text-secondary">
            Une seule application pour choisir votre auto-école, suivre votre progression et rester
            en contact — sans paperasse.
          </p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
                  <f.icon className="h-4 w-4" strokeWidth={2} />
                </span>
                {f.label}
              </li>
            ))}
          </ul>

          <Link href="/onboarding" className="btn-primary mt-8 inline-flex">
            Créer mon compte élève
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
