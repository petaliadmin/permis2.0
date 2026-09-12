'use client';

import { cn } from '@/lib/cn';

export interface SchoolFilters {
  city: string;
  category: string;
  q: string;
  maxPriceXof: string;
}

export type SchoolSort = 'recent' | 'price-asc' | 'price-desc' | 'name';

export const EMPTY_SCHOOL_FILTERS: SchoolFilters = { city: '', category: '', q: '', maxPriceXof: '' };

export const CITIES = [
  'Dakar',
  'Guédiawaye',
  'Rufisque',
  'Thiès',
  'Mbour',
  'Saint-Louis',
  'Kaolack',
  'Ziguinchor',
  'Touba',
];
const CATEGORIES = ['A', 'B', 'C', 'D', 'E'];
const PRICE_TIERS = [
  { value: '70000', label: "Jusqu'à 70 000 F" },
  { value: '100000', label: "Jusqu'à 100 000 F" },
  { value: '150000', label: "Jusqu'à 150 000 F" },
];
const SORTS: { value: SchoolSort; label: string }[] = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'name', label: 'Nom (A–Z)' },
];

interface SchoolFiltersBarProps {
  filters: SchoolFilters;
  onChange: (filters: SchoolFilters) => void;
  sort: SchoolSort;
  onSortChange: (sort: SchoolSort) => void;
  geoActive?: boolean;
}

const selectCls =
  'rounded-full border border-token bg-surface-2 px-3.5 py-1.5 text-xs font-bold text-secondary focus:border-primary-400 focus:outline-none';

export function SchoolFiltersBar({
  filters,
  onChange,
  sort,
  onSortChange,
  geoActive,
}: SchoolFiltersBarProps) {
  const hasFilters =
    filters.city !== '' || filters.category !== '' || filters.q !== '' || filters.maxPriceXof !== '';

  return (
    <div className="space-y-3">
      <div className="relative">
        <i
          className="ti ti-search pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary"
          aria-hidden="true"
        />
        <input
          type="text"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Rechercher une auto-école…"
          className="w-full rounded-xl border border-token bg-surface-2 py-2.5 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted focus:border-primary-400 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.city}
          onChange={(e) => onChange({ ...filters, city: e.target.value })}
          className={selectCls}
          aria-label="Filtrer par ville"
        >
          <option value="">Toutes les villes</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filters.maxPriceXof}
          onChange={(e) => onChange({ ...filters, maxPriceXof: e.target.value })}
          className={selectCls}
          aria-label="Filtrer par budget"
        >
          <option value="">Tous les prix</option>
          {PRICE_TIERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={geoActive ? 'distance' : sort}
          onChange={(e) => onSortChange(e.target.value as SchoolSort)}
          disabled={geoActive}
          className={cn(selectCls, geoActive && 'opacity-60')}
          aria-label="Trier les résultats"
        >
          {geoActive && <option value="distance">Les plus proches</option>}
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => onChange(EMPTY_SCHOOL_FILTERS)}
            className="chip bg-surface-2 text-secondary hover:text-foreground"
          >
            <i className="ti ti-x" aria-hidden="true" />
            Effacer
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => onChange({ ...filters, category: filters.category === c ? '' : c })}
            className={cn(
              'chip',
              filters.category === c ? 'chip-primary' : 'bg-surface-2 text-secondary'
            )}
            aria-pressed={filters.category === c}
          >
            Permis {c}
          </button>
        ))}
      </div>
    </div>
  );
}
