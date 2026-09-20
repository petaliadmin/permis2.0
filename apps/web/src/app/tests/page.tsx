import type { Metadata } from 'next';
import TestsClient from './TestsClient';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Test rapide code de la route',
  description:
    'Un test rapide de 20 questions aléatoires pour évaluer ton niveau au code de la route sénégalais en quelques minutes.',
  path: '/tests',
  // Lot 0.4 — server HTML is a near-empty shell (content loads client-side),
  // well under the 250-word floor. Re-indexable once server-rendered content
  // lands (see brief Lot 1). noindex preserved; buildMetadata's
  // self-referential canonical alongside it is fine (Lot 2.1) — the
  // forbidden pairing was noindex + a canonical pointing elsewhere.
  robots: { index: false, follow: true },
});

export default function Page() {
  return <TestsClient />;
}
