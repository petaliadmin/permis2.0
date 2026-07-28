'use client';

import Link from 'next/link';
import type { School } from '@permis2.0/types';
import { cn } from '@/lib/cn';

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

interface SchoolCardProps {
  school: School;
  /** Distance from the visitor, computed client-side after geolocation. */
  distanceKm?: number;
  selected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
}

export function SchoolCard({ school, distanceKm, selected, onSelect, compact }: SchoolCardProps) {
  const location = [school.district, school.city].filter(Boolean).join(', ');

  return (
    <div
      onClick={onSelect}
      className={cn(
        'rounded-2xl border bg-surface-1 p-4 shadow-soft transition-colors',
        onSelect && 'cursor-pointer',
        selected ? 'border-primary-400 ring-2 ring-primary-100' : 'border-token hover:border-primary-200'
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 text-lg font-black text-primary-700 dark:from-primary-900/40 dark:to-primary-800/40 dark:text-primary-300"
          aria-hidden="true"
        >
          {school.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            school.name.charAt(0).toUpperCase()
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-extrabold text-foreground">
            {school.name}
          </p>
          {location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-secondary">
              <i className="ti ti-map-pin text-sm" aria-hidden="true" />
              {location}
              {distanceKm != null && <span className="text-muted"> · {distanceKm.toFixed(1)} km</span>}
            </p>
          )}
          {typeof school.studentsCount === 'number' && school.studentsCount > 0 && (
            <p className="mt-0.5 text-xs text-muted">{school.studentsCount} élèves</p>
          )}
        </div>

        {school.priceXof != null && (
          <p className="shrink-0 text-right font-display text-sm font-extrabold text-primary-600">
            {fmtXof(school.priceXof)}
          </p>
        )}
      </div>

      {!compact && (school.services.length > 0 || school.licenseCategories.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {school.licenseCategories.map((c) => (
            <span key={c} className="chip chip-primary">
              Permis {c}
            </span>
          ))}
          {school.services.slice(0, 3).map((s) => (
            <span key={s} className="chip chip-violet">
              {s}
            </span>
          ))}
        </div>
      )}

      {!compact && (
        <div className="mt-4 flex gap-2">
          <Link
            href={`/ecoles/${school.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="btn-ghost !px-3 !py-2 flex-1 text-xs"
          >
            Voir le profil
          </Link>
          <Link
            href={`/ecoles/${school.slug}#preinscription`}
            onClick={(e) => e.stopPropagation()}
            className="btn-primary !px-3 !py-2 flex-1 text-xs"
          >
            Pré-inscription
          </Link>
        </div>
      )}
    </div>
  );
}
