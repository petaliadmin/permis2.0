'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { School } from '@permis2.0/types';
import { Skeleton, EmptyState } from '@permis2.0/ui';
import { API_URL } from '@/lib/dataSource';
import { haversineKm, type LatLng } from '@/lib/geo';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SchoolCard } from '@/components/SchoolCard';
import { SchoolFiltersBar, type SchoolFilters } from '@/components/SchoolFiltersBar';
import { cn } from '@/lib/cn';

// Google Maps needs `window` — never rendered during SSR.
const SchoolsMap = dynamic(
  () => import('@/components/SchoolsMap').then((m) => m.SchoolsMap),
  { ssr: false, loading: () => <Skeleton className="h-full min-h-[320px] w-full" /> }
);

const EMPTY_FILTERS: SchoolFilters = { city: '', category: '', q: '' };

export default function EcolesClient() {
  const [filters, setFilters] = useState<SchoolFilters>(EMPTY_FILTERS);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.city) params.set('city', filters.city);
      if (filters.category) params.set('category', filters.category);
      if (filters.q) params.set('q', filters.q);
      params.set('take', '50');

      fetch(`${API_URL}/schools?${params}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setSchools(Array.isArray(data) ? data : []))
        .catch(() => setSchools([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [filters]);

  const sorted = useMemo(() => {
    if (!userPos) return schools;
    return [...schools].sort((a, b) => {
      const da = a.latitude != null && a.longitude != null ? haversineKm(userPos, { lat: a.latitude, lng: a.longitude }) : Infinity;
      const db = b.latitude != null && b.longitude != null ? haversineKm(userPos, { lat: b.latitude, lng: b.longitude }) : Infinity;
      return da - db;
    });
  }, [schools, userPos]);

  const distanceFor = (s: School): number | undefined =>
    userPos && s.latitude != null && s.longitude != null
      ? haversineKm(userPos, { lat: s.latitude, lng: s.longitude })
      : undefined;

  const locate = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Géolocalisation non supportée par ce navigateur.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError('Impossible de vous localiser — autorisez la géolocalisation.')
    );
  };

  const selectFromMap = (id: string) => {
    setSelectedId(id || null);
    if (id) cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />

      <div className="border-b border-token bg-surface-1 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-display text-2xl font-extrabold text-foreground">
            Trouver une auto-école
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {loading ? 'Recherche…' : `${sorted.length} auto-école${sorted.length > 1 ? 's' : ''} trouvée${sorted.length > 1 ? 's' : ''}`}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <SchoolFiltersBar filters={filters} onChange={setFilters} />
            </div>
            <button onClick={locate} className="btn-ghost shrink-0 !px-4 !py-2.5 text-sm">
              <i className="ti ti-current-location" aria-hidden="true" />
              Autour de moi
            </button>
          </div>
          {geoError && <p className="mt-2 text-xs font-medium text-danger">{geoError}</p>}
        </div>
      </div>

      {/* Mobile tab switch — map and list don't fit side by side below lg */}
      <div className="flex border-b border-token bg-surface-1 lg:hidden">
        {(['list', 'map'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={cn(
              'flex-1 py-3 text-sm font-bold transition-colors',
              mobileTab === tab ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary'
            )}
          >
            {tab === 'list' ? 'Liste' : 'Carte'}
          </button>
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div
          className={cn(
            'w-full space-y-3 lg:block lg:w-[420px] lg:shrink-0',
            mobileTab === 'map' && 'hidden'
          )}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          ) : sorted.length === 0 ? (
            <EmptyState
              icon={<i className="ti ti-map-pin-off" aria-hidden="true" />}
              title="Aucune auto-école trouvée"
              description="Essayez d'élargir vos filtres."
            />
          ) : (
            sorted.map((s) => (
              <div key={s.id} ref={(el) => { cardRefs.current[s.id] = el; }}>
                <SchoolCard
                  school={s}
                  distanceKm={distanceFor(s)}
                  selected={selectedId === s.id}
                  onSelect={() => setSelectedId(s.id)}
                />
              </div>
            ))
          )}
        </div>

        <div className={cn('min-h-[420px] w-full flex-1 lg:block', mobileTab === 'list' && 'hidden')}>
          <div className="sticky top-24 h-[calc(100vh-220px)] min-h-[420px]">
            <SchoolsMap schools={sorted} selectedId={selectedId} onSelect={selectFromMap} />
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
