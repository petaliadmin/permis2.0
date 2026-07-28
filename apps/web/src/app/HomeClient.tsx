'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { School } from '@permis2.0/types';
import { API_URL } from '@/lib/dataSource';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SchoolCard } from '@/components/SchoolCard';
import { Skeleton } from '@permis2.0/ui';

const FEATURES = [
  {
    icon: 'ti-road-sign',
    accent: 'chip-primary',
    title: 'Préparation au code',
    description: 'Cours, panneaux et exercices pour maîtriser le code de la route.',
  },
  {
    icon: 'ti-clipboard-check',
    accent: 'chip-orange',
    title: 'Examens blancs',
    description: 'Entraînez-vous en conditions réelles, chronométrées.',
  },
  {
    icon: 'ti-map-pin',
    accent: 'chip-violet',
    title: "Recherche d'auto-écoles",
    description: 'Comparez les auto-écoles près de chez vous et pré-inscrivez-vous en ligne.',
  },
  {
    icon: 'ti-chart-line',
    accent: 'chip-success',
    title: 'Suivi de progression',
    description: 'Statistiques détaillées, badges et niveaux pour rester motivé.',
  },
  {
    icon: 'ti-calendar',
    accent: 'chip-xp',
    title: 'Planning des cours',
    description: 'Rendez-vous et séances pratiques, bientôt disponibles.',
  },
  {
    icon: 'ti-building-store',
    accent: 'chip-danger',
    title: 'Gestion pour les auto-écoles',
    description: 'Un ERP complet pour piloter élèves, moniteurs et véhicules — bientôt disponible.',
  },
];

const STEPS = [
  { title: 'Je crée un compte', description: 'Inscription gratuite en moins d’une minute.' },
  { title: 'Je choisis une auto-école', description: 'Comparez, filtrez, et pré-inscrivez-vous.' },
  { title: 'Je révise', description: 'Cours, quiz et examens blancs à volonté.' },
  { title: 'Je réussis mon permis', description: 'Suivez votre progression jusqu’au jour J.' },
];

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero px-4 py-16 text-white sm:py-24">
      <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/5" />
      <div className="relative mx-auto max-w-3xl text-center">
        <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-5xl">
          Réussissez votre permis, du code à l&apos;auto-école
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
          Révisez le code de la route et trouvez l&apos;auto-école idéale près de chez vous — tout
          en un.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/onboarding" className="btn-primary bg-white !text-primary-700 shadow-xl">
            Commencer gratuitement
          </Link>
          <Link href="/ecoles" className="btn-violet">
            Trouver une auto-école
          </Link>
          <Link href="/exam" className="btn-ghost !border-white/40 !bg-white/10 !text-white">
            Voir les examens
          </Link>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="text-center font-display text-2xl font-extrabold text-foreground sm:text-3xl">
        Tout ce qu&apos;il faut pour réussir
      </h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card">
            <span className={`chip ${f.accent} mb-3`}>
              <i className={`ti ${f.icon}`} aria-hidden="true" />
            </span>
            <p className="font-display text-base font-bold text-foreground">{f.title}</p>
            <p className="mt-1 text-sm text-secondary">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="bg-surface-1 py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-2xl font-extrabold text-foreground sm:text-3xl">
          Comment ça marche
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 font-display text-base font-extrabold text-white">
                {i + 1}
              </span>
              <p className="mt-3 font-display text-sm font-bold text-foreground">{s.title}</p>
              <p className="mt-1 text-xs text-secondary">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnerSchools({ schools, loading }: { schools: School[]; loading: boolean }) {
  if (!loading && schools.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
          Auto-écoles partenaires
        </h2>
        <Link href="/ecoles" className="text-sm font-bold text-primary-600 hover:underline">
          Voir toutes les auto-écoles →
        </Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          : schools.map((s) => <SchoolCard key={s.id} school={s} compact />)}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-gradient-primary px-4 py-16 text-center text-white">
      <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Prêt à commencer ?</h2>
      <p className="mx-auto mt-2 max-w-md text-white/85">
        Créez votre compte gratuitement et démarrez votre préparation dès aujourd&apos;hui.
      </p>
      <Link href="/onboarding" className="btn-primary mt-6 inline-flex bg-white !text-primary-700">
        Commencer gratuitement
      </Link>
    </section>
  );
}

export default function HomeClient() {
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);

  useEffect(() => {
    // Already-onboarded/returning visitors keep the exact behavior '/' has
    // always had — straight into the app, zero added friction.
    if (localStorage.getItem('permis_onboarding_done')) {
      router.replace('/traffic-signs');
      return;
    }
    setCheckingOnboarding(false);
  }, [router]);

  useEffect(() => {
    if (checkingOnboarding) return;
    fetch(`${API_URL}/schools?take=6`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSchools(Array.isArray(data) ? data : []))
      .catch(() => setSchools([]))
      .finally(() => setLoadingSchools(false));
  }, [checkingOnboarding]);

  if (checkingOnboarding) return null;

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <Hero />
      <Features />
      <HowItWorks />
      <PartnerSchools schools={schools} loading={loadingSchools} />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}
