import { serializeUrlset, SITEMAP_XML_HEADERS, type SitemapEntry } from '@/lib/sitemapXml';
import { getBlogPostsSorted } from '@/lib/articles';

const SITE_URL = 'https://www.permis2.com';

// Articles now live in the DB and can change without a redeploy (edited from
// /admin/articles), so this route can't be force-static like sitemap-pages.xml
// — it relies on getBlogPostsSorted()'s own fetch revalidate (300s) instead.

export async function GET() {
  const posts = await getBlogPostsSorted();
  const entries: SitemapEntry[] = [
    { url: `${SITE_URL}/blog` },
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
    })),
  ];

  return new Response(serializeUrlset(entries), { headers: SITEMAP_XML_HEADERS });
}
