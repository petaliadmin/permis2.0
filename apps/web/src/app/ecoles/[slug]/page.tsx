import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { School, SchoolReviewsResponse } from '@permis2.0/types';
import EcoleProfileClient from './EcoleProfileClient';
import { buildMetadata } from '@/lib/seo/metadata';
import { organizationNode, websiteNode, graphScript, SITE_URL } from '@/lib/seo/jsonLd';

// dataSource.ts is a 'use client' module — its exports can't be called from a
// Server Component (RSC replaces them with a throwing stub), so this Server
// Component resolves its own API_URL locally, same as the front-end stores do.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// JSONB doesn't preserve key order — restore a natural week order, same
// logic as EcoleProfileClient's display so the two never drift apart.
const DAY_ORDER = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
const DAY_SCHEMA: Record<string, string> = {
  lun: 'Monday',
  mar: 'Tuesday',
  mer: 'Wednesday',
  jeu: 'Thursday',
  ven: 'Friday',
  sam: 'Saturday',
  dim: 'Sunday',
};

/** Parses a free-form "8h-18h" / "08:00-18:00" range into schema.org times.
 *  Returns null (dropped, never guessed) for anything that doesn't match —
 *  e.g. "Fermé" — a school's own free text isn't reshaped into fabricated
 *  open/close times. */
function parseHourRange(range: string): { opens: string; closes: string } | null {
  const m = range.match(/(\d{1,2})[h:](\d{2})?\s*-\s*(\d{1,2})[h:](\d{2})?/);
  if (!m) return null;
  const pad = (h: string, mnt?: string) => `${h.padStart(2, '0')}:${(mnt ?? '00').padStart(2, '0')}`;
  return { opens: pad(m[1], m[2]), closes: pad(m[3], m[4]) };
}

function schoolJsonLd(school: School, reviews: SchoolReviewsResponse | null): string {
  const streetAddress = [school.district, school.address].filter(Boolean).join(', ');

  const openingHoursSpecification = school.openingHours
    ? Object.entries(school.openingHours)
        .map(([day, range]) => {
          const dayKey = Object.keys(DAY_SCHEMA).find((d) => day.toLowerCase().startsWith(d));
          const parsed = dayKey && parseHourRange(range);
          return dayKey && parsed
            ? {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: `https://schema.org/${DAY_SCHEMA[dayKey]}`,
                opens: parsed.opens,
                closes: parsed.closes,
              }
            : null;
        })
        .filter((s): s is NonNullable<typeof s> => s != null)
        .sort((a, b) => {
          const rank = (url: string) =>
            DAY_ORDER.indexOf(
              Object.entries(DAY_SCHEMA).find(([, en]) => `https://schema.org/${en}` === url)?.[0] ?? ''
            );
          return rank(a.dayOfWeek) - rank(b.dayOfWeek);
        })
    : [];

  const categoryPrices =
    school.pricesByCategory && Object.keys(school.pricesByCategory).length > 0
      ? school.pricesByCategory
      : null;

  const drivingSchool = {
    '@type': 'DrivingSchool',
    name: school.name,
    url: `${SITE_URL}/ecoles/${school.slug}`,
    ...(school.description ? { description: school.description } : {}),
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
    ...(openingHoursSpecification.length > 0 ? { openingHoursSpecification } : {}),
    // Real aggregate only, and only once at least one review exists (Lot 5)
    // — never a placeholder rating.
    ...(reviews && reviews.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: reviews.averageRating,
            reviewCount: reviews.reviewCount,
          },
        }
      : {}),
    // Real per-category prices when the school has entered them (Lot 3.3 —
    // "tarifs par catégorie"); falls back to the single priceRange summary
    // otherwise. Never both — one school-entered number shouldn't imply
    // per-category detail that doesn't exist.
    ...(categoryPrices
      ? {
          makesOffer: Object.entries(categoryPrices).map(([code, price]) => ({
            '@type': 'Offer',
            name: `Permis ${code}`,
            priceCurrency: 'XOF',
            price,
          })),
        }
      : school.priceXof != null
        ? { priceRange: `À partir de ${school.priceXof.toLocaleString('fr-FR')} FCFA` }
        : {}),
  };
  return graphScript([organizationNode(), websiteNode(), drivingSchool]);
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

async function fetchReviews(schoolId: string): Promise<SchoolReviewsResponse | null> {
  try {
    const res = await fetch(`${API_URL}/schools/${schoolId}/reviews`, { next: { revalidate: 300 } });
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
  return buildMetadata({
    title: `${school.name}${location ? ` — ${location}` : ''}`,
    description: `Découvrez ${school.name}, ses services, ses tarifs, et pré-inscrivez-vous en ligne.`,
    path: `/ecoles/${school.slug}`,
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = await fetchSchool(slug);
  if (!school) notFound();
  const reviews = await fetchReviews(school.id);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schoolJsonLd(school, reviews) }}
      />
      <EcoleProfileClient
        school={school}
        reviews={reviews ?? { reviews: [], averageRating: null, reviewCount: 0 }}
      />
    </>
  );
}
