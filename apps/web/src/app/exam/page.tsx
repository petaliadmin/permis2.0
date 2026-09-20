import type { Metadata } from 'next';
import ExamClient from './ExamClient';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Examen blanc du permis de conduire',
  description:
    "Passe un examen blanc dans les conditions réelles de l'examen du permis de conduire au Sénégal et évalue ton niveau avant le jour J.",
  path: '/exam',
  // Lot 0.4 — server HTML is a near-empty shell (content loads client-side),
  // well under the 250-word floor. Re-indexable once server-rendered content
  // lands (see brief Lot 1). noindex preserved; buildMetadata's
  // self-referential canonical alongside it is fine (Lot 2.1) — the
  // forbidden pairing was noindex + a canonical pointing elsewhere.
  robots: { index: false, follow: true },
});

export default function Page() {
  return <ExamClient />;
}
