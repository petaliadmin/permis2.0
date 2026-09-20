import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { School } from '@permis2.0/types';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SchoolCard } from '@/components/SchoolCard';
import { slugify } from '@/lib/slug';
import { IconChevronRight } from '@tabler/icons-react';

const SITE_URL = 'https://www.permis2.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Brief Lot 3.2 — GARDE-FOU OBLIGATOIRE: a city page only exists with ≥3
// real schools. Enforced in generateStaticParams (below), in the runtime
// notFound() guard (so a direct request for a sub-threshold city 404s even
// if it slipped into static params on a stale build), and in
// sitemap-ecoles.xml once that's wired up (Lot 3.5) — not just in what's
// visually displayed.
const MIN_SCHOOLS_PER_CITY = 3;

// School.city is free text (see mon-ecole/CreateSchoolForm.tsx) — not a fixed
// enum — so valid city slugs are resolved from what's actually in the
// directory right now, same source as the parent page's "Villes couvertes".
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

/** Cities with enough real schools to deserve their own page. */
async function citiesAboveThreshold(): Promise<string[]> {
  const schools = await fetchAllSchools();
  const counts = new Map<string, number>();
  for (const s of schools) {
    if (!s.city) continue;
    counts.set(s.city, (counts.get(s.city) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count >= MIN_SCHOOLS_PER_CITY).map(([city]) => city);
}

export async function generateStaticParams() {
  const cities = await citiesAboveThreshold();
  return cities.map((city) => ({ ville: slugify(city) }));
}

async function resolveCity(slug: string): Promise<string | null> {
  const cities = await citiesAboveThreshold();
  return cities.find((c) => slugify(c) === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ville: string }>;
}): Promise<Metadata> {
  const { ville } = await params;
  const city = await resolveCity(ville);
  if (!city) return { title: 'Auto-écoles introuvables' };

  return {
    title: `Auto-écoles à ${city} — Comparer et pré-inscrire en ligne`,
    description: `Trouvez une auto-école à ${city} : services, tarifs, catégories de permis proposées, et pré-inscription en ligne gratuite.`,
    alternates: { canonical: `/auto-ecoles-senegal/${ville}` },
  };
}

function jsonLd(city: string, ville: string, schools: School[]) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Auto-écoles',
        item: `${SITE_URL}/auto-ecoles-senegal`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: city,
        item: `${SITE_URL}/auto-ecoles-senegal/${ville}`,
      },
    ],
  };
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: schools.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/ecoles/${s.slug}`,
      name: s.name,
    })),
  };
  return [breadcrumb, itemList];
}

export default async function VilleAutoEcolesPage({
  params,
}: {
  params: Promise<{ ville: string }>;
}) {
  const { ville } = await params;
  const allSchools = await fetchAllSchools();
  const city = [...new Set(allSchools.map((s) => s.city).filter((c): c is string => !!c))].find(
    (c) => slugify(c) === ville
  );
  if (!city) notFound();

  const schools = allSchools.filter((s) => s.city === city);
  if (schools.length < MIN_SCHOOLS_PER_CITY) notFound();

  const categories = [...new Set(schools.flatMap((s) => s.licenseCategories ?? []))].sort();

  return (
    <div className="on-light min-h-screen bg-surface">
      {jsonLd(city, ville, schools).map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-foreground">
            Accueil
          </Link>
          <IconChevronRight size="1em" className="text-[10px]" aria-hidden="true" />
          <Link href="/auto-ecoles-senegal" className="hover:text-foreground">
            Auto-écoles
          </Link>
          <IconChevronRight size="1em" className="text-[10px]" aria-hidden="true" />
          <span className="text-foreground">{city}</span>
        </nav>

        <span className="chip chip-primary">Sénégal</span>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Auto-écoles à {city}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-secondary sm:text-base">
          {schools.length} auto-école{schools.length > 1 ? 's' : ''} partenaire
          {schools.length > 1 ? 's' : ''} {schools.length > 1 ? 'sont référencées' : 'est référencée'}{' '}
          à {city}
          {categories.length > 0 && (
            <>
              , proposant les catégories de permis{' '}
              <strong className="text-foreground">{categories.join(', ')}</strong>
            </>
          )}
          . Comparez-les et pré-inscrivez-vous en ligne, gratuitement.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {schools.map((school) => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-primary-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-sm font-bold text-primary-700">
            Voir toutes les auto-écoles, y compris sur la carte
          </p>
          <Link
            href={`/ecoles?city=${encodeURIComponent(city)}`}
            className="btn-primary shrink-0 !py-2.5 text-sm"
          >
            Ouvrir l'annuaire
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/auto-ecoles-senegal" className="font-semibold text-primary-600 hover:underline">
            Auto-écoles au Sénégal
          </Link>{' '}
          ·{' '}
          <Link
            href="/permis-conduire-senegal"
            className="font-semibold text-primary-600 hover:underline"
          >
            Permis de conduire au Sénégal
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
