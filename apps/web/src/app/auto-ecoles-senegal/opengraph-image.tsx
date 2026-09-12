import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/ogImage';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = 'Auto-écoles au Sénégal — PERMIS 2.0';

export default async function Image() {
  return renderOgImage('Auto-écoles au Sénégal', 'Comparer, choisir, pré-inscrire en ligne');
}
