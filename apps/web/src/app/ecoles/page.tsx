import type { Metadata } from 'next';
import { Suspense } from 'react';
import type { School } from '@permis2.0/types';
import EcolesClient from './EcolesClient';
import { buildMetadata } from '@/lib/seo/metadata';

// dataSource.ts is a 'use client' module — unusable from this Server
// Component (see ecoles/[slug]/page.tsx for the same note).
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata: Metadata = buildMetadata({
  title: 'Trouver une auto-école au Sénégal',
  description:
    'Comparez les auto-écoles partenaires par ville, catégorie de permis et prix, localisez-les sur la carte, et pré-inscrivez-vous en ligne.',
  path: '/ecoles',
});

async function fetchInitialSchools(city?: string): Promise<School[]> {
  try {
    const params = new URLSearchParams({ take: '50' });
    if (city) params.set('city', city);
    const res = await fetch(`${API_URL}/schools?${params}`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const schools = await res.json();
    return Array.isArray(schools) ? schools : [];
  } catch {
    return [];
  }
}

// SEO audit finding (Étape 1, bloquant) — this page used to render an empty
// client component with no server-fetched data: the raw HTML had zero
// school names/addresses/links, just navigation chrome. Real content now
// comes from the server on first load; EcolesClient's own fetch (filters,
// sort, geolocation) stays client-side since those are genuinely
// interactive and can't be known at request time.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city } = await searchParams;
  const initialSchools = await fetchInitialSchools(city);
  return (
    <Suspense>
      <EcolesClient initialSchools={initialSchools} />
    </Suspense>
  );
}
