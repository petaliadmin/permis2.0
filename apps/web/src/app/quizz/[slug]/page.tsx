import type { Metadata } from 'next';
import { getCategoryBySlug } from '../config';
import CategoryClient from './CategoryClient';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: 'Catégorie introuvable' };

  return buildMetadata({
    title: `${category.title} — Quiz code de la route`,
    description: category.description,
    path: `/quizz/${slug}`,
  });
}

export default function Page() {
  return <CategoryClient />;
}
