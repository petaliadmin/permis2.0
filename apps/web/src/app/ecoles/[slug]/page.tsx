import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { School } from '@permis2.0/types';
import EcoleProfileClient from './EcoleProfileClient';

// dataSource.ts is a 'use client' module — its exports can't be called from a
// Server Component (RSC replaces them with a throwing stub), so this Server
// Component resolves its own API_URL locally, same as the front-end stores do.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

  return <EcoleProfileClient school={school} />;
}
