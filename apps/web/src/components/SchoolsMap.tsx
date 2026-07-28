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
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-token bg-surface-2 p-6 text-center">
        <i className="ti ti-map-off text-3xl text-muted" aria-hidden="true" />
        <p className="text-sm font-semibold text-secondary">Carte indisponible pour le moment</p>
        <p className="text-xs text-muted">Consultez la liste des auto-écoles ci-contre.</p>
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
              background={selectedId === school.id ? '#2563eb' : '#7c3aed'}
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
