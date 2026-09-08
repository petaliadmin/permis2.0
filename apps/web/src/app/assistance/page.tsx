import type { Metadata } from 'next';
import AssistanceClient from './AssistanceClient';

export const metadata: Metadata = {
  title: 'Assistance & FAQ',
  description:
    "Questions fréquentes sur PERMIS 2.0 : abonnement, paiement, révision hors-ligne et contact avec l'équipe pour votre préparation au permis au Sénégal.",
  alternates: { canonical: '/assistance' },
};

export default function Page() {
  return <AssistanceClient />;
}
