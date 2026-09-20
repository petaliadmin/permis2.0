import type { Metadata } from 'next';
import TrafficSignsClient from './TrafficSignsClient';
import { TrafficSignsFullIndex } from './TrafficSignsFullIndex';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata: Metadata = {
  title: 'Panneaux de signalisation du Sénégal',
  // Lot 2.7 — dropped "en français et en wolof": no wolof content exists at
  // hub/category level, only per-sign audio where a recording happens to
  // exist (hooks/useWolofAudio.ts).
  // Lot 2.1 — was 119 chars (under the 140-160 target); the wolof mention
  // dropped in Lot 2.7 left room to describe the content more usefully.
  description:
    'Apprenez tous les panneaux de signalisation routière du code sénégalais : danger, interdiction, obligation, indication — avec fiches détaillées et quiz.',
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
