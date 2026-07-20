import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.permis2.com';

// Static, guest-accessible content routes only — dynamic per-item pages
// (a single quiz attempt, a course lesson id) aren't meaningful standalone
// search results, so they're left out rather than enumerated.
const ROUTES: { path: string; priority: number }[] = [
  { path: '/traffic-signs', priority: 1 },
  { path: '/cours', priority: 0.9 },
  { path: '/quizz', priority: 0.9 },
  { path: '/tests', priority: 0.8 },
  { path: '/exam', priority: 0.7 },
  { path: '/boutique', priority: 0.5 },
  { path: '/assistance', priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: 'weekly',
    priority,
  }));
}
