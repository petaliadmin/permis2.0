import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/ogImage';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SignSummary {
  name: string;
  meaning: string;
}

async function fetchSign(slug: string): Promise<SignSummary | null> {
  try {
    const res = await fetch(`${API_URL}/traffic-signs/by-slug/${slug}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sign = await fetchSign(slug);

  return renderOgImage(sign ? `Panneau ${sign.name}` : 'Panneau du Code de la route', sign?.meaning);
}
