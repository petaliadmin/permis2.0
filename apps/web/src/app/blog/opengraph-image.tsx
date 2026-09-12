import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/ogImage';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = 'Blog PERMIS 2.0';

export default async function Image() {
  return renderOgImage('Conseils pour réussir le Code et le permis', 'Le blog PERMIS 2.0');
}
