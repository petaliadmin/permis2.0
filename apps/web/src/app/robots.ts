import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { spaceFromHost, PUBLIC_ON_ANY_HOST } from '@/lib/space';

const SITE_URL = 'https://www.permis2.com';

// Sub-paths that stay unindexable even under an otherwise-public prefix —
// same exceptions on every host, so a dynamic/personalized page doesn't
// become crawlable on learn just because its parent prefix is shared with
// www (see PUBLIC_ON_ANY_HOST).
const DYNAMIC_EXCEPTIONS = [
  '/quizz/erreurs',
  // Blocks only /quizz/{slug}/{quizId} (a single quiz attempt — dynamic,
  // personalized, not a meaningful standalone search result). /quizz/{slug}
  // (the indexable série page) has one path segment, so this doesn't touch it.
  '/quizz/*/*',
  '/exam/diapo/',
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const space = spaceFromHost(h.get('host'));

  // SEO brief Lot 1.1 (Option A): www is the one indexable host. learn/
  // school/admin serve the same public routes too (traffic-signs, quizz,
  // cours, tests, exam, abonnement — PUBLIC_ON_ANY_HOST) but must never
  // rank on their own. `X-Robots-Tag: noindex` (middleware.ts) is what
  // actually governs that — but Google can only read a response header on a
  // page it's allowed to fetch. A blanket `Disallow: /` hid that header
  // entirely, so Google kept ranking learn.* URLs it had already crawled
  // before the noindex existed (Search Console audit, 2026-09: e.g.
  // learn.permis2.com/quizz still getting impressions). Explicitly allowing
  // just the shared public prefixes lets Google recrawl them, see the
  // noindex, and drop them — everything else on these hosts (student/school/
  // admin private areas) stays fully blocked.
  if (space !== 'www') {
    return {
      rules: {
        userAgent: '*',
        allow: PUBLIC_ON_ANY_HOST,
        disallow: ['/', ...DYNAMIC_EXCEPTIONS],
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        // NOT '/auth/' — every /auth/* page now sets a real
        // <meta name="robots" content="noindex,nofollow"> (auth/layout.tsx).
        // Blocking it in robots.txt hid that tag from Google the same way as
        // learn.* above: /auth/login stayed indexed despite the "block" this
        // list used to imply (Search Console audit, 2026-09).
        '/notifications',
        '/profil',
        '/mon-ecole',
        '/mes-auto-ecoles',
        '/onboarding',
        ...DYNAMIC_EXCEPTIONS,
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
