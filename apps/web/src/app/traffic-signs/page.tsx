import type { Metadata } from 'next';
import TrafficSignsClient from './TrafficSignsClient';

export const metadata: Metadata = {
  title: 'Panneaux de signalisation du Sénégal',
  description:
    'Apprenez tous les panneaux de signalisation routière du code sénégalais : danger, interdiction, obligation, indication — avec explications en français et en wolof.',
  // Lot 0.4 — server HTML is a near-empty shell (hub content loads client-side),
  // well under the 250-word floor. Re-indexable once the hub is server-rendered
  // (see brief Lot 1.2).
  // canonical: null clears it rather than inheriting root layout's
  // `alternates.canonical: '/'` (which resolves to www regardless of the
  // actual host) — that combined with noindex was rule 4's forbidden
  // noindex+external-canonical pairing. A real self-referent, host-aware
  // canonical is Lot 1.1/2.1's job.
  alternates: { canonical: null },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <TrafficSignsClient />;
}
