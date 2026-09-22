import sharp from 'sharp';
import { renderCardImage } from '@/lib/ogImage';
import { getBlogPost } from '@/lib/articles';

// 16:9, ≥1200px wide, WebP — brief Lot 2.6 (BlogPosting.image + og:image
// share this one file, rather than the 1.91:1 PNG the other opengraph-image.tsx
// routes use, which is the standard convention for og:image/twitter:image but
// not what the brief's recette asks for on BlogPosting.image specifically).
const SIZE = { width: 1200, height: 675 };

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  const png = renderCardImage(post?.title ?? 'Blog PERMIS 2.0', post?.category, SIZE);
  const pngBuffer = Buffer.from(await png.arrayBuffer());
  const webpBuffer = await sharp(pngBuffer).webp({ quality: 82 }).toBuffer();

  return new Response(new Uint8Array(webpBuffer), {
    headers: {
      'Content-Type': 'image/webp',
      // Content only changes when blog.ts's post title/category changes (a
      // deploy) — same cadence as the rest of the blog content (Lot 1.6).
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
