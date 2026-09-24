'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { SubscriptionPlan } from '@permis2.0/types';
import { IconChevronRight } from '@tabler/icons-react';

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

function planByType(plans: SubscriptionPlan[], type: SubscriptionPlan['type']) {
  return plans.filter((p) => p.type === type && p.active).sort((a, b) => a.ordre - b.ordre)[0] ?? null;
}

interface PricingProps {
  plans: SubscriptionPlan[];
}

export function Pricing({ plans }: PricingProps) {
  const studentPlan = planByType(plans, 'STUDENT');
  const schoolPlan = planByType(plans, 'SCHOOL');
  const studentMonths = studentPlan ? Math.round(studentPlan.durationDays / 30) : 4;

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
          <span className="chip chip-orange">Tarifs</span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            Des tarifs simples, sans surprise
          </h2>
          <p className="mt-3 text-base text-secondary">
            Un abonnement pour l&apos;élève, un abonnement pour l&apos;auto-école — activation
            immédiate après paiement.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6"
          >
            <span className="chip chip-orange">Élève</span>
            {studentPlan ? (
              <div className="mt-3 flex items-end gap-1.5">
                <span className="font-display text-4xl font-black text-orange-600">
                  {fmtXof(studentPlan.priceXof)}
                </span>
                <span className="mb-1.5 text-sm font-semibold text-muted">
                  / {studentMonths} mois
                </span>
              </div>
            ) : (
              <p className="mt-3 text-sm text-secondary">Tarif sur /tarifs</p>
            )}
            <p className="mt-2 text-sm text-secondary">
              Accès illimité aux quiz, examens blancs et cours de conduite.
            </p>
            <Link href="/abonnement" className="btn-primary mt-5 inline-flex">
              S&apos;abonner
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-6"
          >
            <span className="chip chip-violet">Auto-école</span>
            {schoolPlan ? (
              <div className="mt-3 flex items-end gap-1.5">
                <span className="font-display text-4xl font-black text-violet-600">
                  {fmtXof(schoolPlan.priceXof)}
                </span>
                <span className="mb-1.5 text-sm font-semibold text-muted">/ mois</span>
              </div>
            ) : (
              <p className="mt-3 text-sm text-secondary">Tarif sur /tarifs</p>
            )}
            <p className="mt-2 text-sm text-secondary">
              Élèves, planning, facturation et visibilité en ligne. 3 mois d&apos;essai gratuit.
            </p>
            <Link href="/logiciel-gestion-auto-ecole" className="btn-violet mt-5 inline-flex">
              Inscrire mon auto-école
            </Link>
          </motion.div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/tarifs"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline"
          >
            Voir tous les tarifs
            <IconChevronRight size="1em" className="text-xs" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
