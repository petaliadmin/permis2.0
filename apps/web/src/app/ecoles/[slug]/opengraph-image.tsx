import type { School } from '@permis2.0/types';
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/ogImage';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchSchool(slug: string): Promise<School | null> {
  try {
    const res = await fetch(`${API_URL}/schools/by-slug/${slug}`, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = await fetchSchool(slug);
  const location = school ? [school.district, school.city].filter(Boolean).join(', ') : undefined;

  return renderOgImage(school?.name ?? 'Auto-école', location);
}
