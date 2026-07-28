'use client';

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Hero } from '@/components/home/Hero';
import { ProblemSolution } from '@/components/home/ProblemSolution';
import { Services } from '@/components/home/Services';
import { HowItWorks } from '@/components/home/HowItWorks';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { ForStudents } from '@/components/home/ForStudents';
import { ForSchools } from '@/components/home/ForSchools';
import { SenegalMap } from '@/components/home/SenegalMap';
import { PartnerSchools } from '@/components/home/PartnerSchools';
import { StatsCounter } from '@/components/home/StatsCounter';
import { Testimonials } from '@/components/home/Testimonials';
import { Faq } from '@/components/home/Faq';
import { FinalCta } from '@/components/home/FinalCta';

export default function HomeClient() {
  return (
    <div className="on-light min-h-screen bg-surface">
      <SiteHeader />
      <Hero />
      <ProblemSolution />
      <Services />
      <HowItWorks />
      <WhyChooseUs />
      <ForStudents />
      <ForSchools />
      <SenegalMap />
      <PartnerSchools />
      <StatsCounter />
      <Testimonials />
      <Faq />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}
