import type { Metadata } from 'next';
import { Suspense } from 'react';
import type { School } from '@permis2.0/types';
import EcolesClient from './EcolesClient';
import { buildMetadata } from '@/lib/seo/metadata';
import { organizationNode, websiteNode, graphScript, SITE_URL } from '@/lib/seo/jsonLd';

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

// SEO audit finding (Étape 5) — /ecoles had no structured data of its own
// (just the root layout's bare Organization/WebSite). A Service node with
// real `areaServed` — never a hardcoded city list — is the correct schema
// for a 300-item directory: one LocalBusiness per row on a single page is
// a spam signal, not a rich-result opportunity.
function jsonLd(allSchools: School[]): string {
  const cities = [...new Set(allSchools.map((s) => s.city).filter((c): c is string => !!c))].sort(
    (a, b) => a.localeCompare(b, 'fr')
  );
  const service = {
    '@type': 'Service',
    serviceType: 'Mise en relation avec des auto-écoles',
    provider: { '@id': `${SITE_URL}/#organization` },
    ...(cities.length > 0
      ? { areaServed: cities.map((name) => ({ '@type': 'City', name })) }
      : {}),
  };
  const itemList = {
    '@type': 'ItemList',
    itemListElement: allSchools.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/ecoles/${s.slug}`,
      name: s.name,
    })),
  };
  return graphScript([organizationNode(), websiteNode(), service, itemList]);
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
  // JSON-LD represents the canonical (unfiltered) /ecoles page regardless
  // of a ?city= deep link — only fetch a second time when the filter
  // actually narrowed the visible list.
  const allSchools = city ? await fetchInitialSchools() : initialSchools;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(allSchools) }} />
      <Suspense>
        <EcolesClient initialSchools={initialSchools} />
      </Suspense>
    </>
  );
}
