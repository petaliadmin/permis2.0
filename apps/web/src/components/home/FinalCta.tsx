'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-gradient-primary px-4 py-24 text-center text-white">
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-2xl"
      >
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
          Prêt à obtenir votre permis plus facilement ?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-white/85">
          Créez votre compte gratuitement et démarrez votre préparation dès aujourd&apos;hui.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/onboarding" className="btn-primary bg-white !text-primary-700 shadow-xl">
            Créer un compte
          </Link>
          <Link
            href="/ecoles"
            className="btn-ghost !border-white/40 !bg-white/10 !text-white hover:!border-white/70 hover:!text-white"
          >
            Trouver une auto-école
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
