import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { School } from '@permis2.0/types';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SchoolCard } from '@/components/SchoolCard';
import { slugify } from '@/lib/slug';
import { IconChevronRight } from '@tabler/icons-react';
import { buildMetadata } from '@/lib/seo/metadata';
import { organizationNode, websiteNode, graphScript, SITE_URL } from '@/lib/seo/jsonLd';

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

// Lot 3.4 — one real, well-established, easily-verifiable sentence per city
// (administrative role, heritage status — never a number we can't stand
// behind, like a population figure). Used to make each city's intro
// genuinely unique on top of the shared real platform data below, not
// invented facts about the city itself. Cities not listed here (any city
// name a school owner enters — `School.city` is free text, not an enum)
// fall back to a neutral sentence instead of a guessed one.
const CITY_FACTS: Record<string, string> = {
  Dakar:
    "Dakar, capitale du Sénégal, occupe la presqu'île du Cap-Vert, le point le plus occidental du continent africain.",
  Guédiawaye:
    "Guédiawaye fait partie de la région de Dakar et compte parmi les communes les plus densément peuplées du pays.",
  Pikine:
    "Pikine fait partie de la région de Dakar et est l'une des communes les plus peuplées de l'agglomération dakaroise.",
  Rufisque:
    "Rufisque, dans la région de Dakar, est l'une des quatre communes historiques du Sénégal colonial, aux côtés de Dakar, Gorée et Saint-Louis.",
  Thiès:
    "Thiès est le chef-lieu de la région du même nom, important carrefour ferroviaire et industriel à l'entrée du pays depuis Dakar.",
  Mbour:
    "Mbour est une ville côtière de la Petite Côte, dans la région de Thiès, connue pour son port de pêche.",
  'Saint-Louis':
    "Saint-Louis, ancienne capitale de l'Afrique occidentale française, est classée au patrimoine mondial de l'UNESCO.",
  Kaolack: 'Kaolack est le chef-lieu de la région du même nom et un carrefour commercial du centre du Sénégal.',
  Ziguinchor: 'Ziguinchor est le chef-lieu de la région du même nom et la principale ville de la Casamance.',
  Touba: "Touba, dans la région de Diourbel, est la ville sainte de la confrérie mouride et l'une des plus peuplées du pays.",
};

function cityIntro(city: string, schools: School[], categories: string[]): string {
  const fact =
    CITY_FACTS[city] ?? `${city} fait partie des villes du Sénégal où PERMIS 2.0 référence des auto-écoles partenaires.`;

  const allPrices = schools.flatMap((s) =>
    s.pricesByCategory ? Object.values(s.pricesByCategory) : s.priceXof != null ? [s.priceXof] : []
  );
  const priceSentence =
    allPrices.length > 0
      ? ` Les tarifs affichés par nos auto-écoles partenaires à ${city} vont de ${Math.min(...allPrices).toLocaleString('fr-FR')} à ${Math.max(...allPrices).toLocaleString('fr-FR')} FCFA selon la catégorie et les services inclus.`
      : '';

  return (
    `${fact} ${schools.length} auto-école${schools.length > 1 ? 's' : ''} partenaire${schools.length > 1 ? 's' : ''} ` +
    `${schools.length > 1 ? 'y sont référencées' : 'y est référencée'} sur PERMIS 2.0` +
    `${categories.length > 0 ? `, couvrant les catégories de permis ${categories.join(', ')}` : ''}.` +
    `${priceSentence} Chaque fiche présente les services proposés, les catégories de permis disponibles et, quand l'auto-école les a renseignés, ses tarifs détaillés et ses horaires. ` +
    `Comparer plusieurs établissements avant de s'engager — sur le prix, mais aussi sur les catégories couvertes et la localisation — reste la meilleure façon de choisir une formation adaptée à votre situation à ${city}. ` +
    "La pré-inscription en ligne est gratuite et ne vous engage à rien : elle permet simplement à l'auto-école choisie de vous recontacter pour la suite des démarches. " +
    "Depuis l'annuaire complet, le tri « Autour de moi » permet aussi de comparer les auto-écoles les plus proches de votre position à l'intérieur de la ville. " +
    "Chaque auto-école reste seule responsable de ses tarifs, de ses délais et de ses conditions d'admission : PERMIS 2.0 ne fixe aucun prix et ne représente pas les autorités sénégalaises compétentes en matière de permis de conduire."
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ville: string }>;
}): Promise<Metadata> {
  const { ville } = await params;
  const city = await resolveCity(ville);
  if (!city) return { title: 'Auto-écoles introuvables' };

  return buildMetadata({
    title: `Auto-écoles à ${city} — Comparer et pré-inscrire en ligne`,
    description: `Trouvez une auto-école à ${city} : services, tarifs, catégories de permis proposées, et pré-inscription en ligne gratuite.`,
    path: `/auto-ecoles-senegal/${ville}`,
  });
}

function jsonLd(city: string, ville: string, schools: School[]): string {
  const breadcrumb = {
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
    '@type': 'ItemList',
    itemListElement: schools.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/ecoles/${s.slug}`,
      name: s.name,
    })),
  };
  return graphScript([organizationNode(), websiteNode(), breadcrumb, itemList]);
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

  // Lot 5 — links to /auto-ecoles-senegal/{ville}/permis-{code} sub-pages,
  // only for categories that clear the same ≥3-school bar as this page
  // itself (see [categorie]/page.tsx) — never linking to a combo that
  // would 404.
  const categoryPageCounts = new Map<string, number>();
  for (const s of schools) {
    for (const c of s.licenseCategories ?? []) categoryPageCounts.set(c, (categoryPageCounts.get(c) ?? 0) + 1);
  }
  const qualifyingCategories = categories.filter((c) => (categoryPageCounts.get(c) ?? 0) >= MIN_SCHOOLS_PER_CITY);

  // Lot 3.4 — "liens villes voisines": every other city that also has its
  // own page (≥3 schools), not a geographic-adjacency guess we can't back
  // with real data. Still does the actual SEO job (internal linking between
  // city pages) without asserting a proximity claim we haven't verified.
  const otherCities = (await citiesAboveThreshold()).filter((c) => c !== city).sort((a, b) => a.localeCompare(b, 'fr'));

  return (
    <div className="on-light min-h-screen bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(city, ville, schools) }}
      />

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
          {cityIntro(city, schools, categories)}
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

        {qualifyingCategories.length > 0 && (
          <div className="mt-8">
            <p className="font-display text-sm font-bold text-foreground">Voir par catégorie de permis</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {qualifyingCategories.map((c) => (
                <Link
                  key={c}
                  href={`/auto-ecoles-senegal/${ville}/permis-${c.toLowerCase()}`}
                  className="rounded-full border border-token bg-surface-1 px-3.5 py-2 text-xs font-semibold text-primary-600 hover:bg-surface-2"
                >
                  Permis {c} à {city}
                </Link>
              ))}
            </div>
          </div>
        )}

        {otherCities.length > 0 && (
          <div className="mt-8">
            <p className="font-display text-sm font-bold text-foreground">
              Auto-écoles dans d&apos;autres villes
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {otherCities.map((c) => (
                <Link
                  key={c}
                  href={`/auto-ecoles-senegal/${slugify(c)}`}
                  className="rounded-full border border-token bg-surface-1 px-3.5 py-2 text-xs font-semibold text-primary-600 hover:bg-surface-2"
                >
                  Auto-écoles à {c}
                </Link>
              ))}
            </div>
          </div>
        )}

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
