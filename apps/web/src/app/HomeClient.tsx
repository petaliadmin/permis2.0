'use client';

import dynamic from 'next/dynamic';
import type { School, SubscriptionPlan } from '@permis2.0/types';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Hero, type PlatformStats } from '@/components/home/Hero';

// Below-the-fold sections: code-split into their own chunks so the browser
// isn't parsing one large bundle before Hero (the LCP element) is interactive.
// `ssr: true` (the default) is kept throughout — this only affects bundling,
// the content still renders in the initial server HTML for SEO/crawlers.
const ProblemSolution = dynamic(() =>
  import('@/components/home/ProblemSolution').then((m) => m.ProblemSolution)
);
const Services = dynamic(() => import('@/components/home/Services').then((m) => m.Services));
const HowItWorks = dynamic(() =>
  import('@/components/home/HowItWorks').then((m) => m.HowItWorks)
);
const WhyChooseUs = dynamic(() =>
  import('@/components/home/WhyChooseUs').then((m) => m.WhyChooseUs)
);
const ForStudents = dynamic(() =>
  import('@/components/home/ForStudents').then((m) => m.ForStudents)
);
const ForSchools = dynamic(() =>
  import('@/components/home/ForSchools').then((m) => m.ForSchools)
);
const Pricing = dynamic(() => import('@/components/home/Pricing').then((m) => m.Pricing));
const SenegalMap = dynamic(() =>
  import('@/components/home/SenegalMap').then((m) => m.SenegalMap)
);
const PartnerSchools = dynamic(() =>
  import('@/components/home/PartnerSchools').then((m) => m.PartnerSchools)
);
const StatsCounter = dynamic(() =>
  import('@/components/home/StatsCounter').then((m) => m.StatsCounter)
);
const Faq = dynamic(() => import('@/components/home/Faq').then((m) => m.Faq));
const FinalCta = dynamic(() => import('@/components/home/FinalCta').then((m) => m.FinalCta));

interface HomeClientProps {
  top20Schools: School[];
  stats: PlatformStats;
  subscriptionPlans: SubscriptionPlan[];
}

export default function HomeClient({ top20Schools, stats, subscriptionPlans }: HomeClientProps) {
  return (
    <div className="on-light min-h-screen bg-surface">
      <SiteHeader />
      <Hero stats={stats} />
      <ProblemSolution />
      <Services />
      <HowItWorks />
      <WhyChooseUs />
      <ForStudents />
      <ForSchools />
      <Pricing plans={subscriptionPlans} />
      <SenegalMap />
      <PartnerSchools initialSchools={top20Schools} />
      <StatsCounter stats={stats} />
      {/* Audit finding — Testimonials was 4 hardcoded quotes/names/avatars
          with no real review data behind them (no Review model exists yet;
          reviewCount/averageRating above are always 0/null in production).
          Falsifiable given the directory itself currently lists 0 schools.
          Removed rather than fabricated; components/home/Testimonials.tsx
          stays in the repo, unused, to wire up once real reviews exist. */}
      <Faq />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}
