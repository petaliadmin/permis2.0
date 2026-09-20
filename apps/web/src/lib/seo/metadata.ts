import type { Metadata } from 'next';
import { SITE_URL } from './jsonLd';

const APP_NAME = 'PERMIS2.0';
// Root layout's title template (app/layout.tsx: `%s · ${APP_NAME}`) appends
// this to every page title — budget the page's own title so the *rendered*
// title stays ≤60 chars (brief Lot 2.1).
const TITLE_SUFFIX = ` · ${APP_NAME}`;
const TITLE_BUDGET = 60 - TITLE_SUFFIX.length;
const DEFAULT_IMAGE = { url: '/images/home/header.png', width: 1448, height: 754, alt: APP_NAME };

export interface PageMetadataInput {
  /** Raw page title (the layout's template adds " · PERMIS2.0"). */
  title: string;
  /** 140-160 chars — logged (not thrown) when out of range, since a
   *  slightly-off description shouldn't break a build. */
  description: string;
  /** Path relative to the site root, e.g. '/traffic-signs'. Every page using
   *  this helper gets a self-referential canonical built from it — no page
   *  should still set `alternates.canonical` by hand. */
  path: string;
  robots?: Metadata['robots'];
  image?: { url: string; width: number; height: number; alt?: string };
  type?: 'website' | 'article';
  article?: { publishedTime?: string; modifiedTime?: string };
}

/**
 * Centralized metadata builder (brief Lot 2.1): one place that builds the
 * self-referential canonical, OG, and Twitter Card, so individual pages stop
 * hand-rolling their own (and drifting — some had OG, some didn't; none had
 * a page-specific Twitter Card image before Lot 2.6's blog covers).
 *
 * Not yet adopted by every page.tsx — that's a large, separate migration
 * (~30 files) out of scope for the pass that introduced this helper. New
 * pages should use it; existing pages keep working with their current
 * hand-written metadata until migrated.
 */
export function buildMetadata(input: PageMetadataInput): Metadata {
  if (process.env.NODE_ENV !== 'production') {
    if (input.title.length > TITLE_BUDGET) {
      console.warn(
        `[seo] ${input.path}: title is ${input.title.length} chars, budget is ${TITLE_BUDGET} ` +
          `(renders at ${input.title.length + TITLE_SUFFIX.length}, over the 60-char target)`
      );
    }
    if (input.description.length < 140 || input.description.length > 160) {
      console.warn(
        `[seo] ${input.path}: description is ${input.description.length} chars, target is 140-160`
      );
    }
  }

  const image = input.image ?? DEFAULT_IMAGE;
  const url = `${SITE_URL}${input.path}`;

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    ...(input.robots ? { robots: input.robots } : {}),
    openGraph: {
      type: input.type ?? 'website',
      url,
      siteName: APP_NAME,
      title: input.title,
      description: input.description,
      images: [image],
      ...(input.article ?? {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [image.url],
    },
  };
}
