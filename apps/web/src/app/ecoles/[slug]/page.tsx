import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { School } from '@permis2.0/types';
import EcoleProfileClient from './EcoleProfileClient';

// dataSource.ts is a 'use client' module — its exports can't be called from a
// Server Component (RSC replaces them with a throwing stub), so this Server
// Component resolves its own API_URL locally, same as the front-end stores do.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SITE_URL = 'https://www.permis2.com';

function schoolJsonLd(school: School) {
  const streetAddress = [school.district, school.address].filter(Boolean).join(', ');
  return {
    '@context': 'https://schema.org',
    '@type': 'DrivingSchool',
    name: school.name,
    url: `${SITE_URL}/ecoles/${school.slug}`,
    ...(school.logoUrl ? { image: school.logoUrl } : {}),
    ...(school.phone || school.whatsapp ? { telephone: school.phone || school.whatsapp } : {}),
    ...(school.email ? { email: school.email } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(streetAddress ? { streetAddress } : {}),
      ...(school.city ? { addressLocality: school.city } : {}),
      addressCountry: 'SN',
    },
    ...(school.latitude != null && school.longitude != null
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: school.latitude,
            longitude: school.longitude,
          },
        }
      : {}),
    ...(school.priceXof != null
      ? { priceRange: `À partir de ${school.priceXof.toLocaleString('fr-FR')} FCFA` }
      : {}),
  };
}

async function fetchSchool(slug: string): Promise<School | null> {
  try {
    const res = await fetch(`${API_URL}/schools/by-slug/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const school = await fetchSchool(slug);
  if (!school) return { title: 'Auto-école introuvable' };

  const location = [school.district, school.city].filter(Boolean).join(', ');
  return {
    title: `${school.name}${location ? ` — ${location}` : ''}`,
    description: `Découvrez ${school.name}, ses services, ses tarifs, et pré-inscrivez-vous en ligne.`,
    alternates: { canonical: `/ecoles/${school.slug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = await fetchSchool(slug);
  if (!school) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolJsonLd(school)) }}
      />
      <EcoleProfileClient school={school} />
    </>
  );
}
