import type { Metadata } from 'next';
import CoursClient from './CoursClient';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Cours de code de la route',
  description:
    'Toutes les leçons du code de la route sénégalais organisées par thème : priorités, vitesse, stationnement, sécurité routière et plus.',
  path: '/cours',
  // Lot 0.4 — server HTML is a near-empty shell (content loads client-side),
  // well under the 250-word floor. Re-indexable once server-rendered content
  // lands (see brief Lot 1). noindex preserved; buildMetadata's
  // self-referential canonical alongside it is fine (Lot 2.1) — the
  // forbidden pairing was noindex + a canonical pointing elsewhere.
  robots: { index: false, follow: true },
});

export default function Page() {
  return <CoursClient />;
}
