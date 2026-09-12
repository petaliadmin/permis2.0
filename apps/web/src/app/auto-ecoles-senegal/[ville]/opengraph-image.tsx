import type { School } from '@permis2.0/types';
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/ogImage';
import { slugify } from '@/lib/slug';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAllSchools(): Promise<School[]> {
  try {
    const res = await fetch(`${API_URL}/schools?take=50`, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const schools = await res.json();
    return Array.isArray(schools) ? schools : [];
  } catch {
    return [];
  }
}

export default async function Image({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params;
  const schools = await fetchAllSchools();
  const cities = [...new Set(schools.map((s) => s.city).filter((c): c is string => !!c))];
  const city = cities.find((c) => slugify(c) === ville) ?? ville;
  const count = schools.filter((s) => s.city === city).length;

  return renderOgImage(
    `Auto-écoles à ${city}`,
    count > 0 ? `${count} auto-école${count > 1 ? 's' : ''} partenaire${count > 1 ? 's' : ''}` : undefined
  );
}
