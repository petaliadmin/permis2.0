'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { School } from '@permis2.0/types';

// Whole-country view when there's nothing to zoom to (no geolocated school yet).
const SENEGAL_CENTER: [number, number] = [14.4974, -14.4524];
const SENEGAL_ZOOM = 7;

interface SchoolsMapProps {
  schools: School[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

/** Colored teardrop pin — mirrors the app's primary/violet palette, no external icon assets needed. */
function pinIcon(color: string) {
  return L.divIcon({
    className: 'permis2-map-pin',
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.7 23.3 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="15" r="6" fill="#fff"/>
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -36],
  });
}

const PIN_DEFAULT = pinIcon('#7c3aed');
const PIN_SELECTED = pinIcon('#003ea8');

/** Recenters/fits the map whenever the set of geolocated schools changes. */
function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    const bounds = points.reduce(
      (b, p) => b.extend(p),
      L.latLngBounds(points[0], points[0])
    );
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
    // Only react to the point set itself, not the map instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)]);
  return null;
}

/**
 * Auto-écoles directory map — OpenStreetMap tiles via Leaflet, no API key
 * required (unlike Google Maps, which needs a billed key we don't want to
 * depend on for a simple pins-on-a-map view).
 */
export function SchoolsMap({ schools, selectedId, onSelect }: SchoolsMapProps) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  const located = useMemo(
    () =>
      schools.filter(
        (s): s is School & { latitude: number; longitude: number } =>
          s.latitude != null && s.longitude != null
      ),
    [schools]
  );

  const points = useMemo<[number, number][]>(
    () => located.map((s) => [s.latitude, s.longitude]),
    [located]
  );

  useEffect(() => {
    if (selectedId) markerRefs.current[selectedId]?.openPopup();
  }, [selectedId]);

  return (
    <MapContainer
      center={SENEGAL_CENTER}
      zoom={SENEGAL_ZOOM}
      scrollWheelZoom
      className="h-full min-h-[320px] w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToMarkers points={points} />

      {located.map((school) => (
        <Marker
          key={school.id}
          position={[school.latitude, school.longitude]}
          icon={selectedId === school.id ? PIN_SELECTED : PIN_DEFAULT}
          ref={(m) => {
            markerRefs.current[school.id] = m;
          }}
          eventHandlers={{
            click: () => onSelect?.(school.id),
            mouseover: (e) => e.target.openPopup(),
          }}
        >
          <Popup>
            <div className="p-1 text-sm">
              <p className="font-bold text-slate-900">{school.name}</p>
              {school.city && <p className="text-xs text-slate-500">{school.city}</p>}
              <Link href={`/ecoles/${school.slug}`} className="mt-1 block text-xs font-bold text-primary-600">
                Voir le profil →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
