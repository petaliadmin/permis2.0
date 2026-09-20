import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { getBlogPostsSorted, type BlogCategory } from '@/content/blog';
import { IconChevronRight } from '@tabler/icons-react';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  // Lot 2.1 — was 72 chars rendered (60 raw + the " · PERMIS2.0" template
  // suffix).
  title: 'Blog — Conseils Code de la route et permis',
  description:
    "Guides et conseils pour préparer le Code de la route et le permis de conduire au Sénégal : méthode de révision, erreurs à éviter, priorités de circulation.",
  path: '/blog',
});

const CATEGORY_CHIP: Record<BlogCategory, string> = {
  'Conseils examen': 'chip-orange',
  'Code de la route': 'chip-primary',
  'Permis de conduire': 'chip-violet',
  'Auto-écoles': 'chip-success',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogPage() {
  const posts = getBlogPostsSorted();

  return (
    <div className="on-light min-h-screen bg-surface">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-foreground">
            Accueil
          </Link>
          <IconChevronRight size="1em" className="text-[10px]" aria-hidden="true" />
          <span className="text-foreground">Blog</span>
        </nav>

        <span className="chip chip-primary">Blog PERMIS 2.0</span>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Conseils pour réussir le Code et le permis
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-secondary sm:text-base">
          Méthodes de révision, erreurs fréquentes à éviter, et explications claires sur les
          règles les plus piégeuses du Code de la route au Sénégal.
        </p>

        <div className="mt-8 space-y-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-2xl border border-token bg-surface-1 p-5 shadow-soft transition-colors hover:bg-surface-2"
            >
              <span className={`chip ${CATEGORY_CHIP[post.category]}`}>{post.category}</span>
              <h2 className="mt-3 font-display text-lg font-bold text-foreground">{post.title}</h2>
              <p className="mt-1.5 text-sm text-secondary">{post.description}</p>
              <p className="mt-3 text-xs text-muted">
                {formatDate(post.publishedAt)} · {post.readingMinutes} min de lecture
              </p>
            </Link>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
