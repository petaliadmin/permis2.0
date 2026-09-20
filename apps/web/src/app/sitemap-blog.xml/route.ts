import { serializeUrlset, SITEMAP_XML_HEADERS, type SitemapEntry } from '@/lib/sitemapXml';
import { getBlogPostsSorted } from '@/content/blog';

const SITE_URL = 'https://www.permis2.com';

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
