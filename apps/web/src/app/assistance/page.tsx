import type { Metadata } from 'next';
import AssistanceClient from './AssistanceClient';
import { ASSISTANCE_FAQS } from '@/lib/assistanceFaq';

export const metadata: Metadata = {
  title: 'Assistance & FAQ',
  description:
    "Questions fréquentes sur PERMIS 2.0 : abonnement, paiement, révision hors-ligne et contact avec l'équipe pour votre préparation au permis au Sénégal.",
  alternates: { canonical: '/assistance' },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: ASSISTANCE_FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <AssistanceClient />
    </>
  );
}
