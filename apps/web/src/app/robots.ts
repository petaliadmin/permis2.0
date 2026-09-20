import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { spaceFromHost } from '@/lib/space';

const SITE_URL = 'https://www.permis2.com';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const space = spaceFromHost(h.get('host'));

  // SEO brief Lot 1.1 (Option A): www is the one indexable host. On
  // learn/school/admin, the `X-Robots-Tag: noindex` response header
  // (middleware.ts) is what actually governs indexing — this just keeps
  // crawlers from spending budget here in the first place, and stops
  // learn.permis2.com/robots.txt from pointing at www's sitemap (the bug
  // the brief measured: a sitemap with no learn.* URLs in it).
  if (space !== 'www') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        '/auth/',
        '/notifications',
        '/profil',
        '/mon-ecole',
        '/mes-auto-ecoles',
        '/onboarding',
        '/quizz/erreurs',
        // Blocks only /quizz/{slug}/{quizId} (a single quiz attempt —
        // dynamic, personalized, not a meaningful standalone search result,
        // same reasoning as sitemap.ts's own comment on per-item pages).
        // /quizz/{slug} (the indexable série page, e.g. "quiz panneaux de
        // danger") has one path segment, so this rule doesn't touch it —
        // checked per brief Lot 1.5, no bug here, nothing to unblock.
        '/quizz/*/*',
        '/exam/diapo/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
