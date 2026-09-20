import type { Metadata } from 'next';
import BoutiqueClient from './BoutiqueClient';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  // Lot 2.1 — was 66 chars rendered (54 raw + suffix). Still noindexed
  // (Lot 0.4), fixed anyway for consistency.
  title: 'Abonnement — Accès illimité au code de la route',
  description:
    'Débloquez tout le contenu premium PERMIS 2.0 : séries de quiz, examens blancs et cours de conduite illimités pour préparer votre permis au Sénégal.',
  path: '/boutique',
  // Lot 0.4 — server HTML is a near-empty shell (content loads client-side),
  // well under the 250-word floor. Re-indexable once server-rendered content
  // lands (see brief Lot 1). noindex preserved; buildMetadata's
  // self-referential canonical alongside it is fine (Lot 2.1) — the
  // forbidden pairing was noindex + a canonical pointing elsewhere.
  robots: { index: false, follow: true },
});

export default function Page() {
  return <BoutiqueClient />;
}
