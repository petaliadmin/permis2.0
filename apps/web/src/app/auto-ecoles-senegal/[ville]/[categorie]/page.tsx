import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { School } from '@permis2.0/types';
import { LICENSE_CATEGORIES } from '@permis2.0/shared';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SchoolCard } from '@/components/SchoolCard';
import { slugify } from '@/lib/slug';
import { IconChevronRight } from '@tabler/icons-react';
import { buildMetadata } from '@/lib/seo/metadata';
import { organizationNode, websiteNode, graphScript, SITE_URL } from '@/lib/seo/jsonLd';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Same bar as the city page itself (Lot 3.2) — a city×catégorie page only
// exists once ≥3 real schools in that city offer that exact category.
// Applying the identical threshold here isn't arbitrary: a page with 1-2
// schools would just be a thinner duplicate of the city page (rule 2's
// 250-word/thin-content concern), not a genuinely useful narrower view.
const MIN_SCHOOLS_PER_COMBO = 3;

const categorySlug = (code: string) => `permis-${code.toLowerCase()}`;
const categoryFromSlug = (slug: string): string | null => {
  const m = /^permis-([a-e])$/i.exec(slug);
  return m ? m[1].toUpperCase() : null;
};
const categoryLabel = (code: string) => LICENSE_CATEGORIES.find((c) => c.code === code)?.label ?? code;

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

/** { ville-slug: { CODE: schools[] } }, pre-filtered to combos that clear the threshold. */
async function qualifyingCombos(): Promise<Map<string, Map<string, School[]>>> {
  const schools = await fetchAllSchools();
  const byCity = new Map<string, School[]>();
  for (const s of schools) {
    if (!s.city) continue;
    byCity.set(s.city, [...(byCity.get(s.city) ?? []), s]);
  }

  const result = new Map<string, Map<string, School[]>>();
  for (const [city, citySchools] of byCity) {
    const byCategory = new Map<string, School[]>();
    for (const code of LICENSE_CATEGORIES.map((c) => c.code)) {
      const matching = citySchools.filter((s) => s.licenseCategories?.includes(code));
      if (matching.length >= MIN_SCHOOLS_PER_COMBO) byCategory.set(code, matching);
    }
    if (byCategory.size > 0) result.set(slugify(city), byCategory);
  }
  return result;
}

export async function generateStaticParams() {
  const combos = await qualifyingCombos();
  return [...combos.entries()].flatMap(([ville, byCategory]) =>
    [...byCategory.keys()].map((code) => ({ ville, categorie: categorySlug(code) }))
  );
}

async function resolveCombo(
  ville: string,
  categorieSlug: string
): Promise<{ city: string; code: string; schools: School[] } | null> {
  const code = categoryFromSlug(categorieSlug);
  if (!code) return null;
  const combos = await qualifyingCombos();
  const byCategory = combos.get(ville);
  const schools = byCategory?.get(code);
  if (!schools) return null;
  // Real city name (accented) for display — schools all share it by construction.
  const city = schools[0].city!;
  return { city, code, schools };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ville: string; categorie: string }>;
}): Promise<Metadata> {
  const { ville, categorie } = await params;
  const combo = await resolveCombo(ville, categorie);
  if (!combo) return { title: 'Auto-écoles introuvables' };

  return buildMetadata({
    title: `Auto-écoles permis ${combo.code} à ${combo.city}`,
    description: `${combo.schools.length} auto-écoles à ${combo.city} formant au permis ${combo.code} (${categoryLabel(combo.code)}). Comparez et pré-inscrivez-vous en ligne.`,
    path: `/auto-ecoles-senegal/${ville}/${categorie}`,
  });
}

function jsonLd(city: string, ville: string, code: string, categorieSlug: string, schools: School[]): string {
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Auto-écoles', item: `${SITE_URL}/auto-ecoles-senegal` },
      { '@type': 'ListItem', position: 3, name: city, item: `${SITE_URL}/auto-ecoles-senegal/${ville}` },
      {
        '@type': 'ListItem',
        position: 4,
        name: `Permis ${code}`,
        item: `${SITE_URL}/auto-ecoles-senegal/${ville}/${categorieSlug}`,
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

export default async function VilleCategoriePage({
  params,
}: {
  params: Promise<{ ville: string; categorie: string }>;
}) {
  const { ville, categorie } = await params;
  const combo = await resolveCombo(ville, categorie);
  if (!combo) notFound();
  const { city, code, schools } = combo;

  // Other categories that also clear the threshold in this same city — real
  // internal links, computed from the same data, never a guessed list.
  const combos = await qualifyingCombos();
  const otherCategories = [...(combos.get(ville)?.keys() ?? [])].filter((c) => c !== code);

  const prices = schools
    .map((s) => s.pricesByCategory?.[code] ?? undefined)
    .filter((p): p is number => typeof p === 'number');

  return (
    <div className="on-light min-h-screen bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(city, ville, code, categorie, schools) }}
      />

      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Fil d'Ariane" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-foreground">
            Accueil
          </Link>
          <IconChevronRight size="1em" className="text-[10px]" aria-hidden="true" />
          <Link href="/auto-ecoles-senegal" className="hover:text-foreground">
            Auto-écoles
          </Link>
          <IconChevronRight size="1em" className="text-[10px]" aria-hidden="true" />
          <Link href={`/auto-ecoles-senegal/${ville}`} className="hover:text-foreground">
            {city}
          </Link>
          <IconChevronRight size="1em" className="text-[10px]" aria-hidden="true" />
          <span className="text-foreground">Permis {code}</span>
        </nav>

        <span className="chip chip-primary">{city}</span>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Auto-écoles permis {code} à {city}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-secondary sm:text-base">
          {schools.length} auto-écoles partenaires à {city} forment au permis {code} ({categoryLabel(code)})
          et sont référencées sur PERMIS 2.0.
          {prices.length > 0 && (
            <>
              {' '}
              Les tarifs affichés pour cette catégorie vont de{' '}
              {Math.min(...prices).toLocaleString('fr-FR')} à {Math.max(...prices).toLocaleString('fr-FR')}{' '}
              FCFA selon l'auto-école et les services inclus.
            </>
          )}{' '}
          Chaque fiche détaille les services proposés, les autres catégories disponibles et, quand
          l'auto-école les a renseignés, ses tarifs précis et ses horaires. Comparer plusieurs
          établissements avant de s'engager reste la meilleure façon de choisir une formation
          adaptée à votre situation. La pré-inscription en ligne est gratuite et ne vous engage à
          rien. Chaque auto-école reste seule responsable de ses tarifs, de ses délais et de ses
          conditions d'admission : PERMIS 2.0 ne fixe aucun prix et ne représente pas les autorités
          sénégalaises compétentes en matière de permis de conduire.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {schools.map((school) => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>

        {otherCategories.length > 0 && (
          <div className="mt-8">
            <p className="font-display text-sm font-bold text-foreground">
              Autres catégories disponibles à {city}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {otherCategories.map((c) => (
                <Link
                  key={c}
                  href={`/auto-ecoles-senegal/${ville}/${categorySlug(c)}`}
                  className="rounded-full border border-token bg-surface-1 px-3.5 py-2 text-xs font-semibold text-primary-600 hover:bg-surface-2"
                >
                  Permis {c} à {city}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-primary-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-sm font-bold text-primary-700">
            Voir toutes les auto-écoles de {city}, y compris sur la carte
          </p>
          <Link href={`/auto-ecoles-senegal/${ville}`} className="btn-primary shrink-0 !py-2.5 text-sm">
            Voir {city}
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
