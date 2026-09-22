// Server-only fetch helpers for articles — content now lives in the DB
// (Article model), edited from /admin/articles. dataSource.ts is a 'use
// client' module and can't be called from Server Components, so this file
// resolves its own API_URL locally, same as apps/web/src/app/ecoles/[slug]/page.tsx.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type BlogCategory = 'Conseils examen' | 'Code de la route' | 'Permis de conduire' | 'Auto-écoles';

export interface FaqBlock {
  question: string;
  answer: string;
}

export type ContentBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'callout'; tone: 'info' | 'success' | 'warning'; title: string; text: string }
  | { type: 'links'; items: { href: string; label: string; external?: boolean }[] };

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: BlogCategory;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  directAnswer: string;
  blocks: ContentBlock[];
  faqs?: FaqBlock[];
}

export async function getBlogPostsSorted(): Promise<BlogPost[]> {
  const res = await fetch(`${API_URL}/articles`, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  return res.json();
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const res = await fetch(`${API_URL}/articles/${slug}`, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  return res.json();
}
