import type { Metadata } from 'next';
import AssistanceClient from './AssistanceClient';
import { ASSISTANCE_FAQS } from '@/lib/assistanceFaq';
import { buildMetadata } from '@/lib/seo/metadata';
import { organizationNode, websiteNode, graphScript } from '@/lib/seo/jsonLd';

export const metadata: Metadata = buildMetadata({
  title: 'Assistance & FAQ',
  description:
    "Questions fréquentes sur PERMIS 2.0 : abonnement, paiement, révision hors-ligne et contact avec l'équipe pour votre préparation au permis au Sénégal.",
  path: '/assistance',
});

function jsonLd(): string {
  const faqPage = {
    '@type': 'FAQPage',
    mainEntity: ASSISTANCE_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
  return graphScript([organizationNode(), websiteNode(), faqPage]);
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd() }} />
      <AssistanceClient />
    </>
  );
}
