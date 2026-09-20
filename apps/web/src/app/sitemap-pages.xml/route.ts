import { serializeUrlset, SITEMAP_XML_HEADERS, type SitemapEntry } from '@/lib/sitemapXml';
import { QUIZ_CATEGORIES } from '@/app/quizz/config';

const SITE_URL = 'https://www.permis2.com';

// Next.js 15 changed the default for GET Route Handlers from cached to
// uncached — without this, the route is dynamic (served `no-store`) even
// though it reads no request data and would otherwise be a perfect static
// response (brief Lot 1.6).
export const dynamic = 'force-static';

// Editorial/static pages + quiz série pages — every one of these currently
// (except /blog itself, grouped with its posts in sitemap-blog.xml instead)
// resolves 200 on www and carries no noindex (verified against the running
// app, brief Lot 1.4 rule: "ne lister QUE des URLs canoniques répondant
// 200"). /cours, /quizz, /tests, /exam, /boutique are deliberately absent:
// still noindexed since Lot 0.4 (near-empty server HTML) — submitting a
// noindexed URL in a sitemap is a well-known anti-pattern, not just
// pointless. /auto-ecoles-senegal/{ville} and /ecoles/{slug} are also
// absent for now: Lot 3.2's 3-schools-per-city guard doesn't exist yet, so
// today's city pages don't meet the brief's own quality bar — Lot 3.5 is
// what's supposed to wire real school/city URLs into sitemap-ecoles.xml.
const STATIC_PAGES = [
  '/',
  '/ecoles',
  '/traffic-signs',
  '/code-route-senegal',
  '/permis-conduire-senegal',
  '/auto-ecoles-senegal',
  '/assistance',
  '/a-propos',
  '/contact',
  '/mentions-legales',
  '/politique-confidentialite',
];

export async function GET() {
  const entries: SitemapEntry[] = [
    ...STATIC_PAGES.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...QUIZ_CATEGORIES.map(({ slug }) => ({ url: `${SITE_URL}/quizz/${slug}` })),
  ];

  return new Response(serializeUrlset(entries), { headers: SITEMAP_XML_HEADERS });
}
