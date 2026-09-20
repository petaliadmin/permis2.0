import type { Metadata } from 'next';
import TrafficSignsClient from './TrafficSignsClient';
import { TrafficSignsFullIndex } from './TrafficSignsFullIndex';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata: Metadata = {
  title: 'Panneaux de signalisation du Sénégal',
  description:
    'Apprenez tous les panneaux de signalisation routière du code sénégalais : danger, interdiction, obligation, indication — avec explications en français et en wolof.',
  alternates: { canonical: '/traffic-signs' },
  // Lot 1.2 — server-rendered now (real data + a full crawlable index below
  // the picker), so the Lot 0.4 noindex (near-empty HTML shell) no longer
  // applies.
};

interface ApiSign {
  code: string | null;
  name: string;
  category: string;
  description: string;
  advice: string[];
  icone?: string | null;
}

interface PanneauRaw {
  name: string;
  code: string;
  description: string;
  category: string;
  icon: string;
  advice?: string[];
}

// Reference content changes rarely — revalidate daily, same as the sign
// detail pages (app/traffic-signs/[slug]/page.tsx), rather than the fully
// static `force-static` the brief suggests: the root layout already reads
// `headers()` (for the www/learn/school/admin space), which makes the whole
// render tree request-dependent — ISR is the pattern already proven to work
// under that constraint elsewhere in this app.
async function fetchSigns(): Promise<PanneauRaw[]> {
  try {
    const res = await fetch(`${API_URL}/traffic-signs?take=300`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const { data } = (await res.json()) as { data: ApiSign[] };
    return data
      .filter((s) => s.code)
      .map((s) => ({
        code: s.code as string,
        name: s.name,
        category: s.category,
        description: s.description,
        icon: s.icone ?? '',
        advice: s.advice,
      }));
  } catch {
    return [];
  }
}

export default async function Page() {
  const signs = await fetchSigns();
  return (
    <TrafficSignsClient
      initialSigns={signs}
      fullIndex={<TrafficSignsFullIndex signs={signs} />}
    />
  );
}
