import { serializeUrlset, SITEMAP_XML_HEADERS, type SitemapEntry } from '@/lib/sitemapXml';
import { slugify } from '@/lib/slug';

const SITE_URL = 'https://www.permis2.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Brief Lot 3.2's guard (also enforced in generateStaticParams and the
// runtime notFound(), see auto-ecoles-senegal/[ville]/page.tsx) — a city
// page only exists with ≥3 real schools.
const MIN_SCHOOLS_PER_CITY = 3;

interface SchoolSitemapEntry {
  slug: string;
  updatedAt: string;
  city: string | null;
}

// Same cadence as sitemap-panneaux.xml (Lot 1.6).
export const revalidate = 3600;

async function fetchSchools(): Promise<SchoolSitemapEntry[]> {
  try {
    const res = await fetch(`${API_URL}/schools/sitemap`, { next: { revalidate } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function GET() {
  const schools = await fetchSchools();

  // Every real school gets its own fiche — Lot 3.2's threshold is about
  // *city aggregation* pages, not individual school profiles (each one has
  // its own real content regardless of how many other schools share its
  // city). Deliberately reads from live data every time rather than
  // assuming what's in production: this file was empty for a while because
  // the brief's audit measured prod at "0 auto-école" while this app's own
  // dev DB has 12 seeded ones — fetching for real here means the sitemap is
  // always correct for whatever's actually live, without needing to know
  // that in advance.
  const schoolEntries: SitemapEntry[] = schools.map((s) => ({
    url: `${SITE_URL}/ecoles/${s.slug}`,
    lastModified: s.updatedAt,
  }));

  const cityCounts = new Map<string, number>();
  for (const s of schools) {
    if (!s.city) continue;
    cityCounts.set(s.city, (cityCounts.get(s.city) ?? 0) + 1);
  }
  const cityEntries: SitemapEntry[] = [...cityCounts.entries()]
    .filter(([, count]) => count >= MIN_SCHOOLS_PER_CITY)
    .map(([city]) => ({ url: `${SITE_URL}/auto-ecoles-senegal/${slugify(city)}` }));

  return new Response(serializeUrlset([...schoolEntries, ...cityEntries]), {
    headers: SITEMAP_XML_HEADERS,
  });
}
