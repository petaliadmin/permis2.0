import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ArticleBlocks } from '@/components/blog/ArticleBlocks';
import { getBlogPost, getBlogPostsSorted, type BlogCategory } from '@/content/blog';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

const SITE_URL = 'https://www.permis2.com';

const CATEGORY_CHIP: Record<BlogCategory, string> = {
  'Conseils examen': 'chip-orange',
  'Code de la route': 'chip-primary',
  'Permis de conduire': 'chip-violet',
  'Auto-écoles': 'chip-success',
};

export function generateStaticParams() {
  return getBlogPostsSorted().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: 'Article introuvable' };

  // Lot 2.6 — one 16:9 WebP image per post, shared by og:image/twitter:image
  // and BlogPosting.image (jsonLd() below), instead of no image at all.
  const coverUrl = `${SITE_URL}/blog/${slug}/cover.webp`;

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      images: [{ url: coverUrl, width: 1200, height: 675, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [coverUrl],
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function jsonLd(post: NonNullable<ReturnType<typeof getBlogPost>>, slug: string) {
  const url = `${SITE_URL}/blog/${slug}`;
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };
  const article = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: `${SITE_URL}/blog/${slug}/cover.webp`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: 'PERMIS2.0' },
    publisher: { '@type': 'Organization', name: 'PERMIS2.0' },
    url,
  };
  const schemas: object[] = [breadcrumb, article];
  if (post.faqs && post.faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }
  return schemas;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <div className="on-light min-h-screen bg-surface">
      {jsonLd(post, slug).map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-foreground">
            Accueil
          </Link>
          <IconChevronRight size="1em" className="text-[10px]" aria-hidden="true" />
          <Link href="/blog" className="hover:text-foreground">
            Blog
          </Link>
          <IconChevronRight size="1em" className="text-[10px]" aria-hidden="true" />
          <span className="truncate text-foreground">{post.title}</span>
        </nav>

        <span className={`chip ${CATEGORY_CHIP[post.category]}`}>{post.category}</span>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>Équipe PERMIS 2.0</span>
          <span aria-hidden="true">·</span>
          <span>Publié le {formatDate(post.publishedAt)}</span>
          {post.updatedAt !== post.publishedAt && (
            <>
              <span aria-hidden="true">·</span>
              <span>Mis à jour le {formatDate(post.updatedAt)}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min de lecture</span>
        </div>

        <p className="mt-6 rounded-2xl bg-surface-1 p-4 text-sm font-medium leading-relaxed text-foreground sm:text-base">
          {post.directAnswer}
        </p>

        <div className="mt-8">
          <ArticleBlocks blocks={post.blocks} />
        </div>

        {post.faqs && post.faqs.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-xl font-bold text-foreground">Questions fréquentes</h2>
            <div className="mt-4 space-y-4">
              {post.faqs.map((f) => (
                <div key={f.question}>
                  <p className="font-display text-sm font-bold text-foreground">{f.question}</p>
                  <p className="mt-1.5 text-sm text-secondary">{f.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-3 rounded-2xl bg-primary-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-sm font-bold text-primary-700">
            Prêt à passer à la pratique ?
          </p>
          <Link href="/quizz" className="btn-primary shrink-0 !py-2.5 text-sm">
            Tester mon niveau
          </Link>
        </div>

        <Link
          href="/blog"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-foreground"
        >
          <IconChevronLeft size="1em" className="text-xs" aria-hidden="true" />
          Tous les articles
        </Link>
      </main>

      <SiteFooter />
    </div>
  );
}
