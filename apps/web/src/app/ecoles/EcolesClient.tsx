'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import type { School } from '@permis2.0/types';
import { Skeleton, EmptyState } from '@permis2.0/ui';
import { API_URL } from '@/lib/dataSource';
import { haversineKm, type LatLng } from '@/lib/geo';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SchoolCard } from '@/components/SchoolCard';
import {
  SchoolFiltersBar,
  EMPTY_SCHOOL_FILTERS,
  type SchoolFilters,
  type SchoolSort,
} from '@/components/SchoolFiltersBar';
import { cn } from '@/lib/cn';
import { IconMapPinOff, IconCurrentLocation, IconCurrentLocationOff } from '@tabler/icons-react';

// Google Maps needs `window` — never rendered during SSR.
const SchoolsMap = dynamic(
  () => import('@/components/SchoolsMap').then((m) => m.SchoolsMap),
  { ssr: false, loading: () => <Skeleton className="h-full min-h-[320px] w-full" /> }
);

export default function EcolesClient({ initialSchools }: { initialSchools: School[] }) {
  // Deep-link support (e.g. /ecoles?city=Dakar from the /auto-ecoles-senegal city pages).
  const searchParams = useSearchParams();
  const cityParam = searchParams.get('city') ?? '';
  const [filters, setFilters] = useState<SchoolFilters>({
    ...EMPTY_SCHOOL_FILTERS,
    city: cityParam,
  });
  const [sort, setSort] = useState<SchoolSort>('recent');
  // Seeded from the server fetch (page.tsx already fetched this exact
  // `city` filter) — real content from the first paint, not an empty list
  // waiting on a client-only fetch.
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Skips the effect's very first run — the server already fetched schools
  // matching the initial filters, so refetching immediately on mount would
  // just flash a loading state over data we already have.
  const isFirstRun = useRef(true);

  const hasFilters =
    filters.city !== '' || filters.category !== '' || filters.q !== '' || filters.maxPriceXof !== '';

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.city) params.set('city', filters.city);
      if (filters.category) params.set('category', filters.category);
      if (filters.q) params.set('q', filters.q);
      if (filters.maxPriceXof) params.set('maxPriceXof', filters.maxPriceXof);
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
    const list = [...schools];
    if (userPos) {
      const d = (s: School) =>
        s.latitude != null && s.longitude != null
          ? haversineKm(userPos, { lat: s.latitude, lng: s.longitude })
          : Infinity;
      return list.sort((a, b) => d(a) - d(b));
    }
    switch (sort) {
      case 'price-asc':
        return list.sort((a, b) => (a.priceXof ?? Infinity) - (b.priceXof ?? Infinity));
      case 'price-desc':
        return list.sort((a, b) => (b.priceXof ?? -Infinity) - (a.priceXof ?? -Infinity));
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      default:
        return list;
    }
  }, [schools, userPos, sort]);

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

  const count = sorted.length;

  return (
    <div className="on-light flex min-h-screen flex-col bg-surface">
      <SiteHeader />

      <div className="border-b border-token bg-surface-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <span className="chip chip-primary">Annuaire</span>
          <h1 className="mt-3 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
            Trouver une auto-école au Sénégal
          </h1>
          <div className="mt-2 max-w-2xl space-y-3 text-sm text-secondary">
            <p>
              Comparez les auto-écoles partenaires par ville, catégorie de permis et budget,
              localisez-les sur la carte et envoyez votre pré-inscription en ligne — gratuitement.
            </p>
            <p>
              Chaque fiche auto-école regroupe les informations utiles pour décider sans vous
              déplacer : adresse et quartier, catégories de permis proposées (A, B, C, D, E),
              services inclus (code en salle ou en ligne, simulateur, conduite), tarif affiché, et
              coordonnées directes (téléphone, WhatsApp) pour poser vos questions avant de vous
              engager.
            </p>
            <p>
              Les filtres ci-dessous permettent de croiser plusieurs critères à la fois : ville,
              catégorie de permis, budget maximum, et tri par proximité si vous autorisez la
              localisation. Utilisez la carte pour visualiser en un coup d'œil les auto-écoles les
              plus proches de chez vous ou de votre lieu de travail, un critère qui pèse sur le
              temps et le coût des déplacements pendant toute la durée de la formation.
            </p>
            <p>
              Une fois une auto-école repérée, sa fiche complète détaille ses services et permet
              d'envoyer une pré-inscription en ligne : l'auto-école reçoit votre demande et vous
              recontacte pour finaliser les modalités (dossier, planning, paiement). Cette
              pré-inscription ne vous engage à rien — elle sert à obtenir des informations
              précises avant de valider votre inscription définitive directement auprès de
              l'auto-école choisie.
            </p>
          </div>

          <p className="mt-4 text-sm font-semibold text-foreground" aria-live="polite">
            {loading
              ? 'Recherche…'
              : `${count} auto-école${count > 1 ? 's' : ''}${
                  userPos ? ' · triées par distance' : ''
                }`}
          </p>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <SchoolFiltersBar
                filters={filters}
                onChange={setFilters}
                sort={sort}
                onSortChange={setSort}
                geoActive={!!userPos}
              />
            </div>
            <button
              onClick={userPos ? () => setUserPos(null) : locate}
              className={cn(
                'shrink-0 !px-4 !py-2.5 text-sm',
                userPos ? 'btn-primary' : 'btn-ghost'
              )}
            >
              {userPos ? (
                <IconCurrentLocationOff size="1em" aria-hidden="true" />
              ) : (
                <IconCurrentLocation size="1em" aria-hidden="true" />
              )}
              {userPos ? 'Désactiver' : 'Autour de moi'}
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
          ) : count === 0 ? (
            <EmptyState
              icon={<IconMapPinOff size="1em" aria-hidden="true" />}
              title={hasFilters ? 'Aucune auto-école ne correspond' : 'Aucune auto-école pour le moment'}
              description={
                hasFilters
                  ? 'Élargissez votre recherche : changez de ville, de budget ou retirez la catégorie de permis.'
                  : 'De nouvelles auto-écoles rejoignent la plateforme chaque semaine. Revenez bientôt.'
              }
              action={
                hasFilters ? (
                  <button
                    onClick={() => setFilters(EMPTY_SCHOOL_FILTERS)}
                    className="btn-ghost !px-4 !py-2 text-sm"
                  >
                    Effacer les filtres
                  </button>
                ) : undefined
              }
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
          <div className="sticky top-24 h-[calc(100vh-220px)] min-h-[420px] overflow-hidden rounded-3xl border border-token shadow-card-lg">
            <SchoolsMap schools={sorted} selectedId={selectedId} onSelect={selectFromMap} />
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
