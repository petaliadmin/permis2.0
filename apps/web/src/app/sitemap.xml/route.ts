import { serializeSitemapIndex, SITEMAP_XML_HEADERS } from '@/lib/sitemapXml';

const SITE_URL = 'https://www.permis2.com';

// Index referencing the 4 segments (brief Lot 1.4) instead of one flat
// 177-URL file. Each segment is its own app/sitemap-*.xml/route.ts — Next's
// sitemap.ts file convention can't produce these exact filenames, only
// /sitemap.xml or /sitemap/{id}.xml.
const SEGMENTS = ['sitemap-pages.xml', 'sitemap-panneaux.xml', 'sitemap-blog.xml', 'sitemap-ecoles.xml'];

export async function GET() {
  const body = serializeSitemapIndex(SEGMENTS.map((s) => `${SITE_URL}/${s}`));
  return new Response(body, { headers: SITEMAP_XML_HEADERS });
}
