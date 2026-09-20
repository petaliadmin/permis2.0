import type { Metadata } from 'next';
import ExamClient from './ExamClient';

export const metadata: Metadata = {
  title: 'Examen blanc du permis de conduire',
  description:
    "Passe un examen blanc dans les conditions réelles de l'examen du permis de conduire au Sénégal et évalue ton niveau avant le jour J.",
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
  return <ExamClient />;
}
