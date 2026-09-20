import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { spaceFromHost, type Space } from '@/lib/space';
import { HOME_FAQS } from '@/lib/homeFaq';
import HomeClient from './HomeClient';
import StudentHome from './learn/StudentHome';
import GestionClient from './mon-ecole/GestionClient';

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: HOME_FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
};

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
    description:
      "Préparez le code de la route, passez des examens blancs, et trouvez l'auto-école idéale près de chez vous. Gratuit pour commencer.",
    alternates: { canonical: '/' },
  };
}

export default async function Page() {
  const space = await currentSpace();
  if (space === 'admin') redirect('/admin');
  if (space === 'learn') return <StudentHome />;
  if (space === 'school') return <GestionClient />;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HomeClient />
    </>
  );
}
