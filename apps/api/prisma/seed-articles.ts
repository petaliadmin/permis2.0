/**
 * Migration unique : copie les articles de blog codés en dur dans
 * apps/web/src/content/blog.ts vers la table `articles` (modèle Article).
 * Idempotent : upsert par clé naturelle (slug).
 *
 *   pnpm --filter @permis2.0/api run prisma:seed:articles
 */
import { PrismaClient } from '@prisma/client';
import * as path from 'path';

const prisma = new PrismaClient();

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  directAnswer: string;
  blocks: unknown[];
  faqs?: unknown[];
}

function loadBlogPosts(): BlogPost[] {
  // apps/web/src/content/blog.ts is a plain data file with zero external
  // imports, so it can be read directly rather than duplicating ~750 lines
  // of article copy in this one-off migration script.
  require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs' } });
  const mod = require(path.resolve(__dirname, '../../web/src/content/blog.ts'));
  return mod.BLOG_POSTS;
}

async function main() {
  const posts = loadBlogPosts();
  let count = 0;
  for (const post of posts) {
    const data = {
      title: post.title,
      description: post.description,
      category: post.category,
      published: true,
      publishedAt: new Date(post.publishedAt),
      readingMinutes: post.readingMinutes,
      directAnswer: post.directAnswer,
      blocks: post.blocks as any,
      faqs: (post.faqs ?? null) as any,
    };
    await prisma.article.upsert({
      where: { slug: post.slug },
      create: { slug: post.slug, ...data },
      update: data,
    });
    count += 1;
  }
  console.log(`✅ Articles: ${count} synchronisés depuis content/blog.ts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
