'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Users,
  Eye,
  Users2,
  LayoutDashboard,
  Receipt,
  UserCog,
  CalendarDays,
  BarChart3,
  Zap,
  type LucideIcon,
} from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  label: string;
}

const FEATURES: Feature[] = [
  { icon: Users, label: "Plus d'élèves" },
  { icon: Eye, label: 'Visibilité en ligne' },
  { icon: Users2, label: 'CRM' },
  { icon: LayoutDashboard, label: 'ERP complet' },
  { icon: Receipt, label: 'Facturation' },
  { icon: UserCog, label: 'Gestion du personnel' },
  { icon: CalendarDays, label: 'Planning' },
  { icon: BarChart3, label: 'Rapports' },
  { icon: Zap, label: 'Automatisation' },
];

export function ForSchools() {
  return (
    <section id="erp" className="scroll-mt-20 bg-surface-1 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="chip chip-violet">Pour les auto-écoles</span>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
              Pilotez votre auto-école comme une vraie entreprise
            </h2>
            <p className="mt-3 text-base text-secondary">
              Un ERP pensé pour le terrain : élèves, moniteurs, véhicules, paiements et examens,
              dans un seul tableau de bord.
            </p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <f.icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  {f.label}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/mon-ecole" className="btn-violet inline-flex">
                Inscrire mon auto-école
              </Link>
              <Link
                href="/logiciel-gestion-auto-ecole"
                className="text-sm font-bold text-violet-700 hover:underline"
              >
                Découvrir le logiciel →
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-100 to-violet-200 shadow-card-lg lg:ml-auto"
          >
            <Image
              src="/images/home/for-schools.jpg"
              alt="Directeur d'auto-école sénégalais consultant son tableau de bord ERP sur ordinateur"
              fill
              sizes="(min-width: 1024px) 480px, 90vw"
              className="object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
