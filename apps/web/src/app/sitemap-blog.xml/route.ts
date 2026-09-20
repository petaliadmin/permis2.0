import { serializeUrlset, SITEMAP_XML_HEADERS, type SitemapEntry } from '@/lib/sitemapXml';
import { getBlogPostsSorted } from '@/content/blog';

const SITE_URL = 'https://www.permis2.com';

// See sitemap-pages.xml — Next.js 15 defaults Route Handlers to uncached.
export const dynamic = 'force-static';

export async function GET() {
  const entries: SitemapEntry[] = [
    { url: `${SITE_URL}/blog` },
    ...getBlogPostsSorted().map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
    })),
  ];

  return new Response(serializeUrlset(entries), { headers: SITEMAP_XML_HEADERS });
}
