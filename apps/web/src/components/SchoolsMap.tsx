'use client';

import { useState } from 'react';
import Link from 'next/link';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import type { School } from '@permis2.0/types';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Google's public demo Map ID — required for AdvancedMarker, works with any
// API key with no extra Cloud Console configuration. Swap for a custom
// styled Map ID later if needed.
const DEMO_MAP_ID = 'DEMO_MAP_ID';

const DAKAR_CENTER = { lat: 14.7167, lng: -17.4677 };

interface SchoolsMapProps {
  schools: School[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

/**
 * Pins + zoom + click-to-select only — no Directions/Distance Matrix API
 * involved (see lib/geo.ts for the client-side distance sort and the
 * external "get directions" deep link instead).
 */
export function SchoolsMap({ schools, selectedId, onSelect }: SchoolsMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const located = schools.filter(
    (s): s is School & { latitude: number; longitude: number } =>
      s.latitude != null && s.longitude != null
  );

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary-50 to-surface-2 p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-soft">
          <i className="ti ti-map-pin text-2xl" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-foreground">
          {located.length > 0
            ? `${located.length} auto-école${located.length > 1 ? 's' : ''} géolocalisée${located.length > 1 ? 's' : ''}`
            : 'Carte interactive bientôt disponible'}
        </p>
        <p className="max-w-xs text-xs text-secondary">
          Retrouvez la liste complète des auto-écoles et leur localisation dans l’annuaire.
        </p>
        <Link
          href="/ecoles"
          className="btn bg-white text-primary-700 shadow-soft hover:bg-primary-50 !px-4 !py-2 text-sm"
        >
          Ouvrir l’annuaire →
        </Link>
      </div>
    );
  }

  const openId = selectedId ?? hoveredId;
  const open = located.find((s) => s.id === openId);

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <Map
        mapId={DEMO_MAP_ID}
        defaultCenter={DAKAR_CENTER}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI={false}
        className="h-full min-h-[320px] w-full rounded-2xl"
      >
        {located.map((school) => (
          <AdvancedMarker
            key={school.id}
            position={{ lat: school.latitude, lng: school.longitude }}
            onClick={() => onSelect?.(school.id)}
            onMouseEnter={() => setHoveredId(school.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <Pin
              background={selectedId === school.id ? '#003EA8' : '#7c3aed'}
              borderColor="#ffffff"
              glyphColor="#ffffff"
            />
          </AdvancedMarker>
        ))}

        {open && (
          <InfoWindow
            position={{ lat: open.latitude, lng: open.longitude }}
            onCloseClick={() => onSelect?.('')}
          >
            <div className="p-1 text-sm">
              <p className="font-bold text-slate-900">{open.name}</p>
              {open.city && <p className="text-xs text-slate-500">{open.city}</p>}
              <Link href={`/ecoles/${open.slug}`} className="mt-1 block text-xs font-bold text-primary-600">
                Voir le profil →
              </Link>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
