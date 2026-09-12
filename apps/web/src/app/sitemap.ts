import type { MetadataRoute } from 'next';
import { slugify } from '@/lib/slug';
import { QUIZ_CATEGORIES } from './quizz/config';

const SITE_URL = 'https://www.permis2.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Static, guest-accessible content routes only — dynamic per-item pages
// (a single quiz attempt, a course lesson id) aren't meaningful standalone
// search results, so they're left out rather than enumerated.
const ROUTES: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/ecoles', priority: 0.9 },
  { path: '/traffic-signs', priority: 1 },
  { path: '/code-route-senegal', priority: 0.9 },
  { path: '/permis-conduire-senegal', priority: 0.9 },
  { path: '/auto-ecoles-senegal', priority: 0.8 },
  { path: '/cours', priority: 0.9 },
  { path: '/quizz', priority: 0.9 },
  { path: '/tests', priority: 0.8 },
  { path: '/exam', priority: 0.7 },
  { path: '/boutique', priority: 0.5 },
  { path: '/auto-ecole', priority: 0.6 },
  { path: '/pack-ecole', priority: 0.4 },
  { path: '/assistance', priority: 0.4 },
  { path: '/a-propos', priority: 0.3 },
  { path: '/contact', priority: 0.3 },
  { path: '/mentions-legales', priority: 0.1 },
  { path: '/politique-confidentialite', priority: 0.1 },
];

interface SchoolSlugEntry {
  slug: string;
  updatedAt: string;
}

async function fetchSchoolEntries(): Promise<SchoolSlugEntry[]> {
  try {
    const res = await fetch(`${API_URL}/schools/sitemap`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    // API unreachable at build/request time — ship the static routes rather than fail the sitemap.
    return [];
  }
}

async function fetchSignSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/traffic-signs?take=500`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const { data } = (await res.json()) as { data: { name: string }[] };
    return [...new Set(data.map((s) => slugify(s.name)))];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: 'weekly',
    priority,
  }));

  const [schools, signSlugs] = await Promise.all([fetchSchoolEntries(), fetchSignSlugs()]);

  const schoolEntries: MetadataRoute.Sitemap = schools.map(({ slug, updatedAt }) => ({
    url: `${SITE_URL}/ecoles/${slug}`,
    lastModified: new Date(updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const signEntries: MetadataRoute.Sitemap = signSlugs.map((slug) => ({
    url: `${SITE_URL}/traffic-signs/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const quizCategoryEntries: MetadataRoute.Sitemap = QUIZ_CATEGORIES.map(({ slug }) => ({
    url: `${SITE_URL}/quizz/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...schoolEntries, ...signEntries, ...quizCategoryEntries];
}
