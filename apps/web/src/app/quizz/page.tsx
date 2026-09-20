import type { Metadata } from 'next';
import QuizzClient from './QuizzClient';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: "Quiz code de la route — séries d'entraînement",
  description:
    "Entraîne-toi avec des séries de quiz thématiques sur le code de la route sénégalais, suis ta progression et révise tes points faibles.",
  path: '/quizz',
  // Lot 0.4 — server HTML is a near-empty shell (content loads client-side),
  // well under the 250-word floor. Re-indexable once server-rendered content
  // lands (see brief Lot 1). noindex preserved; buildMetadata's
  // self-referential canonical alongside it is fine (Lot 2.1) — the
  // forbidden pairing was noindex + a canonical pointing elsewhere.
  robots: { index: false, follow: true },
});

export default function Page() {
  return <QuizzClient />;
}
