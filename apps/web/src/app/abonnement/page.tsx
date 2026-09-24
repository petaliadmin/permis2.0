import type { Metadata } from 'next';
import AbonnementClient from './AbonnementClient';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Abonnement — Accès illimité au code de la route',
  description:
    'Débloquez tout le contenu premium PERMIS 2.0 : séries de quiz, examens blancs et cours de conduite illimités pour préparer votre permis au Sénégal.',
  path: '/abonnement',
  // Server HTML is a near-empty shell (content loads client-side), well
  // under the SEO word floor — same rationale as the page it replaces.
  robots: { index: false, follow: true },
});

export default function Page() {
  return <AbonnementClient />;
}
