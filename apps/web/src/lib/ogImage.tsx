import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

/**
 * Shared branded template for dynamic opengraph-image.tsx route files —
 * every page that shared the generic homepage photo as its social preview
 * gets a title-specific card instead (see opengraph-image.tsx siblings).
 */
export function renderOgImage(title: string, subtitle?: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #003ea8 0%, #001a3d 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              fontWeight: 900,
              color: '#ffffff',
            }}
          >
            P
          </div>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: '#ffffff' }}>
            PERMIS<span style={{ color: '#8fc0ff' }}>2.0</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000 }}>
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 40 ? 52 : 62,
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#ffffff',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ display: 'flex', fontSize: 28, color: 'rgba(255,255,255,0.82)' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
