'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { School, SchoolReviewsResponse } from '@permis2.0/types';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { whatsappLinkTo } from '@/lib/contact';
import { directionsUrl } from '@/lib/geo';
import { trackEvent } from '@/lib/analytics';
import { EnrollmentForm } from './EnrollmentForm';
import { SchoolReviews } from './SchoolReviews';
import { IconBrandWhatsapp, IconChevronLeft, IconMail, IconMapPin, IconPhone, IconRoute } from '@tabler/icons-react';

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

interface EcoleProfileClientProps {
  school: School;
  reviews: SchoolReviewsResponse;
}

export default function EcoleProfileClient({ school, reviews }: EcoleProfileClientProps) {
  useEffect(() => {
    trackEvent('school_viewed', { school_id: school.id, school_name: school.name });
  }, [school.id, school.name]);

  const location = [school.district, school.city].filter(Boolean).join(', ');
  // JSONB doesn't preserve key order — restore a natural week order for display.
  const DAY_ORDER = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
  const dayRank = (label: string) => {
    const i = DAY_ORDER.findIndex((d) => label.toLowerCase().startsWith(d));
    return i === -1 ? 99 : i;
  };
  const hours = school.openingHours
    ? Object.entries(school.openingHours).sort(([a], [b]) => dayRank(a) - dayRank(b))
    : [];

  return (
    <div className="on-light min-h-screen bg-surface">
      <SiteHeader />

      <header className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl items-start gap-4">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-2xl font-black backdrop-blur"
            aria-hidden="true"
          >
            {school.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={school.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              school.name.charAt(0).toUpperCase()
            )}
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{school.name}</h1>
            {location && (
              <p className="mt-1 flex items-center gap-1 text-sm text-white/85">
                <IconMapPin size="1em" aria-hidden="true" />
                {location}
              </p>
            )}
            {typeof school.studentsCount === 'number' && school.studentsCount > 0 && (
              <p className="mt-1 text-sm text-white/70">{school.studentsCount} élèves</p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {school.description && (
              <div className="card">
                <p className="font-display text-sm font-bold text-foreground">À propos</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-secondary">
                  {school.description}
                </p>
              </div>
            )}

            {(school.services.length > 0 || school.licenseCategories.length > 0) && (
              <div className="card">
                <p className="font-display text-sm font-bold text-foreground">Services & permis</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {school.licenseCategories.map((c) => (
                    <span key={c} className="chip chip-primary">
                      Permis {c}
                    </span>
                  ))}
                  {school.services.map((s) => (
                    <span key={s} className="chip chip-violet">
                      {s}
                    </span>
                  ))}
                </div>
                {school.pricesByCategory && Object.keys(school.pricesByCategory).length > 0 ? (
                  <div className="mt-4 space-y-1.5 border-t border-token pt-3">
                    {Object.entries(school.pricesByCategory).map(([code, price]) => (
                      <div key={code} className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-foreground">Permis {code}</span>
                        <span className="font-display font-extrabold text-primary-600">
                          {fmtXof(price)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  school.priceXof != null && (
                    <p className="mt-4 font-display text-xl font-extrabold text-primary-600">
                      À partir de {fmtXof(school.priceXof)}
                    </p>
                  )
                )}
              </div>
            )}

            {hours.length > 0 && (
              <div className="card">
                <p className="font-display text-sm font-bold text-foreground">Horaires</p>
                <ul className="mt-2 space-y-1 text-sm text-secondary">
                  {hours.map(([day, range]) => (
                    <li key={day} className="flex justify-between">
                      <span>{day}</span>
                      <span>{range}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {school.address && (
              <div className="card">
                <p className="font-display text-sm font-bold text-foreground">Adresse</p>
                <p className="mt-1 text-sm text-secondary">{school.address}</p>
                {school.latitude != null && school.longitude != null && (
                  <a
                    href={directionsUrl({ lat: school.latitude, lng: school.longitude })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary-600 hover:underline"
                  >
                    <IconRoute size="1em" aria-hidden="true" />
                    Itinéraire
                  </a>
                )}
              </div>
            )}

            <div className="card space-y-2">
              <p className="font-display text-sm font-bold text-foreground">Contact</p>
              {school.phone && (
                <a href={`tel:${school.phone}`} className="flex items-center gap-2 text-sm text-secondary hover:text-foreground">
                  <IconPhone size="1em" aria-hidden="true" />
                  {school.phone}
                </a>
              )}
              {school.whatsapp && (
                <a
                  href={whatsappLinkTo(school.whatsapp, `Bonjour ${school.name}, je vous contacte depuis PERMIS 2.0.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-secondary hover:text-foreground"
                >
                  <IconBrandWhatsapp size="1em" aria-hidden="true" />
                  WhatsApp
                </a>
              )}
              {school.email && (
                <a href={`mailto:${school.email}`} className="flex items-center gap-2 text-sm text-secondary hover:text-foreground">
                  <IconMail size="1em" aria-hidden="true" />
                  {school.email}
                </a>
              )}
            </div>

            <SchoolReviews schoolId={school.id} initialData={reviews} />

            <Link href="/ecoles" className="inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:text-foreground">
              <IconChevronLeft size="1em" aria-hidden="true" />
              Retour à l&apos;annuaire
            </Link>
          </div>

          <div id="preinscription" className="scroll-mt-24">
            <p className="mb-3 font-display text-sm font-bold text-foreground">Faire une pré-inscription</p>
            <EnrollmentForm school={school} />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
