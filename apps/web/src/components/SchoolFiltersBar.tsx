'use client';

import { cn } from '@/lib/cn';

export interface SchoolFilters {
  city: string;
  category: string;
  q: string;
}

const CITIES = ['Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Touba', 'Mbour', 'Kaolack'];
const CATEGORIES = ['A', 'B', 'C', 'D', 'E'];

interface SchoolFiltersBarProps {
  filters: SchoolFilters;
  onChange: (filters: SchoolFilters) => void;
}

export function SchoolFiltersBar({ filters, onChange }: SchoolFiltersBarProps) {
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
          className="rounded-full border border-token bg-surface-2 px-3.5 py-1.5 text-xs font-bold text-secondary focus:border-primary-400 focus:outline-none"
        >
          <option value="">Toutes les villes</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => onChange({ ...filters, category: filters.category === c ? '' : c })}
            className={cn(
              'chip',
              filters.category === c ? 'chip-primary' : 'bg-surface-2 text-secondary'
            )}
          >
            Permis {c}
          </button>
        ))}
      </div>
    </div>
  );
}
