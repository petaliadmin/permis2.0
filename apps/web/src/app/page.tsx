import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { School } from '@permis2.0/types';
import { spaceFromHost, type Space } from '@/lib/space';
import { HOME_FAQS } from '@/lib/homeFaq';
import HomeClient from './HomeClient';
import type { PlatformStats } from '@/components/home/Hero';
import StudentHome from './learn/StudentHome';
import GestionClient from './mon-ecole/GestionClient';
import { organizationNode, websiteNode, graphScript } from '@/lib/seo/jsonLd';
import { fetchSubscriptionPlans } from '@/lib/fetchSubscriptionPlans';

// dataSource.ts is a 'use client' module — unusable from this Server
// Component (see ecoles/[slug]/page.tsx for the same note).
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchTop20Schools(): Promise<School[]> {
  try {
    const res = await fetch(`${API_URL}/schools/top20`, { cache: 'no-store' });
    if (!res.ok) return [];
    const schools = await res.json();
    return Array.isArray(schools) ? schools : [];
  } catch {
    return [];
  }
}

const EMPTY_STATS: PlatformStats = {
  schoolsCount: 0,
  studentsCount: 0,
  citiesCount: 0,
  averageRating: null,
  reviewCount: 0,
};

async function fetchPlatformStats(): Promise<PlatformStats> {
  try {
    const res = await fetch(`${API_URL}/stats/platform`, { next: { revalidate: 300 } });
    if (!res.ok) return EMPTY_STATS;
    return res.json();
  } catch {
    return EMPTY_STATS;
  }
}

const SEO_DESCRIPTION =
  "Préparez le code de la route, passez des examens blancs, et trouvez l'auto-école idéale près de chez vous. Gratuit pour commencer.";

// Lot 2.4 — one @graph (WebSite + Organization + FAQPage) instead of the
// 3 separate <script> blocks the audit measured (layout.tsx's WebSite,
// layout.tsx's Organization, this page's own FAQPage). The root layout
// skips its own base script here (pageProvidesOwnGraph('/') — see
// lib/seo/jsonLd.ts) so this is the page's only JSON-LD.
const homeJsonLd = graphScript([
  organizationNode(),
  websiteNode(SEO_DESCRIPTION),
  {
    '@type': 'FAQPage',
    mainEntity: HOME_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  },
]);

async function currentSpace(): Promise<Space> {
  const h = await headers();
  return (h.get('x-permis-space') as Space) || spaceFromHost(h.get('host'));
}

export async function generateMetadata(): Promise<Metadata> {
  const space = await currentSpace();
  if (space === 'learn')
    return {
      title: 'Mon espace — réviser le code de la route',
      description:
        'Panneaux, cours, séries de quiz et examens blancs du code de la route sénégalais.',
      // Lot 1.1 — canonical: null clears it rather than inheriting the root
      // layout's `alternates.canonical: '/'` (resolves to the www home
      // regardless of host). StudentHome is a personalized dashboard with no
      // www equivalent to point to, and a canonical to an unrelated page
      // combined with noindex is exactly what brief rule 4 forbids. `index:
      // false` stays (learn.* is fully noindexed under Option A — see
      // robots.ts and the `X-Robots-Tag` response header); `follow: true`
      // now, since nofollow here was also blocking link equity from ever
      // reaching the indexable child pages this dashboard links to.
      alternates: { canonical: null },
      robots: { index: false, follow: true },
    };
  if (space === 'school')
    return {
      title: 'Espace auto-école — gérer mes élèves',
      description:
        'Pré-inscriptions, élèves, équipe, planning et paiements de votre auto-école, dans un seul tableau de bord.',
      // canonical: null — same rule-4 fix as the learn root above: no www
      // equivalent exists for this private dashboard.
      alternates: { canonical: null },
      robots: { index: false, follow: false },
    };
  if (space === 'admin')
    return {
      title: 'Administration',
      alternates: { canonical: null },
      robots: { index: false, follow: false },
    };
  return {
    title: 'PERMIS 2.0 — Réviser le code et trouver son auto-école au Sénégal',
    description: SEO_DESCRIPTION,
    alternates: { canonical: '/' },
  };
}

export default async function Page() {
  const space = await currentSpace();
  if (space === 'admin') redirect('/admin');
  if (space === 'learn') return <StudentHome />;
  if (space === 'school') return <GestionClient />;
  const [top20Schools, stats, subscriptionPlans] = await Promise.all([
    fetchTop20Schools(),
    fetchPlatformStats(),
    fetchSubscriptionPlans(),
  ]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: homeJsonLd }} />
      <HomeClient top20Schools={top20Schools} stats={stats} subscriptionPlans={subscriptionPlans} />
    </>
  );
}
