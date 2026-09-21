'use client';

import dynamic from 'next/dynamic';
import type { School } from '@permis2.0/types';
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
const SenegalMap = dynamic(() =>
  import('@/components/home/SenegalMap').then((m) => m.SenegalMap)
);
const PartnerSchools = dynamic(() =>
  import('@/components/home/PartnerSchools').then((m) => m.PartnerSchools)
);
const StatsCounter = dynamic(() =>
  import('@/components/home/StatsCounter').then((m) => m.StatsCounter)
);
const Testimonials = dynamic(() =>
  import('@/components/home/Testimonials').then((m) => m.Testimonials)
);
const Faq = dynamic(() => import('@/components/home/Faq').then((m) => m.Faq));
const FinalCta = dynamic(() => import('@/components/home/FinalCta').then((m) => m.FinalCta));

interface HomeClientProps {
  top20Schools: School[];
  stats: PlatformStats;
}

export default function HomeClient({ top20Schools, stats }: HomeClientProps) {
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
      <SenegalMap />
      <PartnerSchools initialSchools={top20Schools} />
      <StatsCounter stats={stats} />
      <Testimonials />
      <Faq />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}
