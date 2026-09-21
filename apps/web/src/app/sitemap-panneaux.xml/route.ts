import { serializeUrlset, SITEMAP_XML_HEADERS, type SitemapEntry } from '@/lib/sitemapXml';
import { slugify } from '@/lib/slug';
import { CATEGORY_ORDER } from '@/lib/trafficSignCategories';

const SITE_URL = 'https://www.permis2.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Next.js 15 defaults GET Route Handlers to uncached — without this the
// route is dynamic (`no-store`) regardless of the fetch's own `revalidate`
// (brief Lot 1.6). Matches the fetch's own cadence below.
export const revalidate = 3600;

interface ApiSign {
  name: string;
  code: string | null;
  updatedAt: string;
}

async function fetchSigns(): Promise<ApiSign[]> {
  try {
    const res = await fetch(`${API_URL}/traffic-signs?take=300`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const { data } = (await res.json()) as { data: ApiSign[] };
    return data;
  } catch {
    return [];
  }
}

export async function GET() {
  const signs = await fetchSigns();

  // Audit finding — `/traffic-signs` itself was listed here AND in
  // sitemap-pages.xml's STATIC_PAGES (which already covers it, with a real
  // <lastmod>) — the same URL appeared in two sitemap files. This file now
  // starts at the category pages; the hub stays sitemap-pages.xml's job.
  const entries: SitemapEntry[] = [
    ...CATEGORY_ORDER.map((cat) => ({ url: `${SITE_URL}/traffic-signs/categorie/${slugify(cat)}` })),
    ...signs.map((s) => ({
      url: `${SITE_URL}/traffic-signs/${slugify(s.name)}`,
      lastModified: s.updatedAt,
      images: s.code ? [`${SITE_URL}/icons/panneaux/${s.code}.svg`] : undefined,
    })),
  ];

  return new Response(serializeUrlset(entries), { headers: SITEMAP_XML_HEADERS });
}
