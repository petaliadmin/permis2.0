/**
 * Manual sitemap XML serialization. Next.js's `sitemap.ts` file convention
 * only ever produces a single `/sitemap.xml` (or `/sitemap/{id}.xml` via
 * `generateSitemaps()`) — neither gives the literal filenames the SEO brief
 * asks for (`sitemap-pages.xml`, `sitemap-panneaux.xml`, ...), so each
 * segment is a `route.ts` under a literal `app/sitemap-*.xml/` folder
 * instead, serialized with these helpers. Deliberately no `changefreq` /
 * `priority` anywhere (brief: Google has ignored both since 2023).
 */

export interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  /** Absolute image URLs — serialized with the image sitemap namespace. */
  images?: string[];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoDate(value: string | Date): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

export function serializeUrlset(entries: SitemapEntry[]): string {
  const hasImages = entries.some((e) => e.images && e.images.length > 0);
  const urls = entries
    .map((e) => {
      const parts = [`<loc>${escapeXml(e.url)}</loc>`];
      if (e.lastModified) parts.push(`<lastmod>${toIsoDate(e.lastModified)}</lastmod>`);
      for (const img of e.images ?? []) {
        parts.push(`<image:image><image:loc>${escapeXml(img)}</image:loc></image:image>`);
      }
      return `<url>${parts.join('')}</url>`;
    })
    .join('');

  const imageNs = hasImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : '';
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${imageNs}>${urls}</urlset>`;
}

export function serializeSitemapIndex(sitemapUrls: string[]): string {
  const entries = sitemapUrls.map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}

export const SITEMAP_XML_HEADERS = {
  'Content-Type': 'application/xml',
  // Same cadence as the entries themselves (brief Lot 1.6) — the sitemap
  // isn't a page Google needs to re-fetch on every crawl.
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};
