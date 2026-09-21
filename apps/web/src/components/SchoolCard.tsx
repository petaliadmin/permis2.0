'use client';

import Link from 'next/link';
import type { School } from '@permis2.0/types';
import { cn } from '@/lib/cn';
import { IconMapPin } from '@tabler/icons-react';

const fmtXof = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;

// Deterministic avatar treatment — every "Auto-École X" would otherwise share
// the same "A" initial and colour, making the list a wall of identical badges.
const AVATAR_ACCENTS = [
  'from-primary-100 to-primary-200 text-primary-700',
  'from-violet-100 to-violet-200 text-violet-700',
  'from-orange-100 to-orange-200 text-orange-700',
  'from-success-100 to-success-200 text-success-700',
];

function avatarFor(name: string) {
  const significant = name.replace(/^(auto[-\s]?[ée]cole|centre|école)\s+(de\s+|du\s+|des\s+|la\s+|le\s+|les\s+)?/i, '');
  const initial = (significant || name).trim().charAt(0).toUpperCase() || '?';
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return { initial, accent: AVATAR_ACCENTS[Math.abs(hash) % AVATAR_ACCENTS.length] };
}

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
  const { initial, accent } = avatarFor(school.name);

  const className = cn(
    'block rounded-2xl border bg-surface-1 p-4 shadow-soft transition-colors',
    (onSelect || compact) && 'cursor-pointer',
    selected ? 'border-primary-400 ring-2 ring-primary-100' : 'border-token hover:border-primary-200'
  );

  const content = (
    <>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-lg font-black',
            accent
          )}
          aria-hidden="true"
        >
          {school.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-extrabold text-foreground">
            {school.name}
          </p>
          {location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-secondary">
              <IconMapPin size="1em" className="text-sm" aria-hidden="true" />
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
    </>
  );

  // compact (homepage Top 20) is never combined with onSelect (the /ecoles
  // picker's own selection interaction) — compact cards link straight to
  // the school's profile instead, so the section is real internal linking,
  // not a dead-end card.
  if (compact) {
    return (
      <Link href={`/ecoles/${school.slug}`} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onSelect} className={className}>
      {content}
    </div>
  );
}
