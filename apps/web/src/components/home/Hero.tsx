'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, School, Users, Trophy, type LucideIcon } from 'lucide-react';

interface Stat {
  icon: LucideIcon;
  label: string;
  sub: string;
}

const STATS: Stat[] = [
  { icon: Star, label: '4.9/5', sub: 'Note moyenne' },
  { icon: School, label: '+300', sub: 'Auto-écoles' },
  { icon: Users, label: '+20 000', sub: 'Élèves' },
  { icon: Trophy, label: '95%', sub: 'Réussite' },
];

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[640px] items-center overflow-hidden px-4 py-20 text-white sm:min-h-[720px] sm:py-28">
      <Image
        src="/images/hero.png"
        alt="Un jeune élève sénégalais reçoit son permis des mains de son moniteur, devant le véhicule de l'auto-école"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover object-[68%_center]"
      />
      {/* Brand-color wash for legibility — the source photo is a light/faded hero image, this keeps text readable in both themes. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950/95 via-primary-900/75 to-primary-900/15" />
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="max-w-xl animate-fade-in [animation-duration:0.6s]">
          <span className="chip bg-white/15 text-white backdrop-blur">
            🇸🇳 La plateforme n°1 du permis au Sénégal
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
            Votre permis de conduire, en toute confiance
          </h1>
          <p className="mt-5 max-w-lg text-base text-white/85 sm:text-lg">
            Comparez les meilleures auto-écoles, révisez le code et suivez votre formation — tout
            en un, du premier clic jusqu&apos;au jour de l&apos;examen.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/onboarding"
              className="btn bg-white text-primary-700 shadow-xl hover:bg-primary-50"
            >
              Créer un compte
            </Link>
            <Link
              href="/ecoles"
              className="btn-ghost !border-white/40 !bg-white/10 !text-white hover:!border-white/70 hover:!text-white"
            >
              Découvrir les auto-écoles
            </Link>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-3 animate-fade-in [animation-delay:0.25s] [animation-duration:0.6s] sm:mt-20 sm:flex sm:flex-wrap sm:gap-4">
          {STATS.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-card-lg backdrop-blur"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <span>
                <span className="block font-display text-sm font-extrabold text-slate-900">
                  {label}
                </span>
                <span className="block text-[11px] font-semibold text-slate-500">{sub}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
