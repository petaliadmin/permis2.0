import type { Metadata } from 'next';
import { getCategoryBySlug } from '../config';
import CategoryClient from './CategoryClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: 'Catégorie introuvable' };

  return {
    title: `${category.title} — Quiz code de la route`,
    description: category.description,
    alternates: { canonical: `/quizz/${slug}` },
  };
}

export default function Page() {
  return <CategoryClient />;
}
