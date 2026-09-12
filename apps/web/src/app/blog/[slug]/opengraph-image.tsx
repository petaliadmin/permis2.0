import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/ogImage';
import { getBlogPost } from '@/content/blog';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  return renderOgImage(post?.title ?? 'Blog PERMIS 2.0', post?.category);
}
