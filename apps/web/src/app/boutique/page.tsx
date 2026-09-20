import type { Metadata } from 'next';
import BoutiqueClient from './BoutiqueClient';

export const metadata: Metadata = {
  // Lot 2.1 — was 66 chars rendered (54 raw + suffix). Still noindexed
  // (Lot 0.4), fixed anyway for consistency.
  title: 'Abonnement — Accès illimité au code de la route',
  description:
    'Débloquez tout le contenu premium PERMIS 2.0 : séries de quiz, examens blancs et cours de conduite illimités pour préparer votre permis au Sénégal.',
  // Lot 0.4 — server HTML is a near-empty shell (content loads client-side),
  // well under the 250-word floor. Re-indexable once server-rendered content
  // lands (see brief Lot 1).
  // canonical: null clears it rather than inheriting root layout's
  // `alternates.canonical: '/'` (which resolves to www regardless of the
  // actual host) — that combined with noindex was rule 4's forbidden
  // noindex+external-canonical pairing. A real self-referent, host-aware
  // canonical is Lot 1.1/2.1's job.
  alternates: { canonical: null },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <BoutiqueClient />;
}
