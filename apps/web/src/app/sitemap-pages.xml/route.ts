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
// 200"). /cours, /quizz, /tests, /exam, /abonnement are deliberately absent:
// still noindexed since Lot 0.4 (near-empty server HTML) — submitting a
// noindexed URL in a sitemap is a well-known anti-pattern, not just
// pointless. /auto-ecoles-senegal/{ville} and /ecoles/{slug} live in
// sitemap-ecoles.xml instead (Lot 3.5), gated by the 3-schools-per-city
// guard (Lot 3.2).
const STATIC_PAGES = [
  '/',
  '/ecoles',
  '/traffic-signs',
  '/code-route-senegal',
  '/permis-conduire-senegal',
  '/tarifs',
  '/auto-ecoles-senegal',
  '/logiciel-gestion-auto-ecole',
  '/assistance',
  '/a-propos',
  '/contact',
  '/mentions-legales',
  '/politique-confidentialite',
];

// Audit finding — every entry here shared one <lastmod> (the build
// timestamp), unlike sitemap-blog.xml and sitemap-panneaux.xml which both
// carry a real per-item editorial date. Google flagged this: 14 URLs with
// the exact same timestamp reads as synthetic, and it stops trusting the
// field (Search Console audit, 2026-09). There's still no per-page "last
// edited" date tracked (no CMS/git-blame wiring — the production Docker
// build context excludes .git, see .dockerignore, so `git log` isn't even
// available at build time to fake one). Same rule as everywhere else in
// this file — a real signal or none — so <lastmod> is simply omitted here
// rather than replaced with another shared, non-meaningful date.
export async function GET() {
  const entries: SitemapEntry[] = [
    ...STATIC_PAGES.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...QUIZ_CATEGORIES.map(({ slug }) => ({ url: `${SITE_URL}/quizz/${slug}` })),
  ];

  return new Response(serializeUrlset(entries), { headers: SITEMAP_XML_HEADERS });
}
