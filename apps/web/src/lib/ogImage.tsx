import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

/**
 * Shared branded card — used both by the opengraph-image.tsx route files
 * (renderOgImage, PNG at the standard 1.91:1 social-preview ratio) and by
 * blog/[slug]/cover.webp (renderCardImage, 16:9 WebP for BlogPosting.image —
 * see brief Lot 2.6). Extracted so both stay visually identical.
 */
function cardElement(title: string, subtitle?: string) {
  return (
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
  );
}

/** PNG at the standard 1.91:1 social-preview ratio — og:image/twitter:image
 *  convention every major platform expects (see opengraph-image.tsx files).
 *  Google was crawling these as standalone image results despite them never
 *  being useful outside a social-share card (Search Console audit, 2026-09)
 *  — `noindex` here, not a robots.txt block: WhatsApp/Facebook still need to
 *  fetch the URL itself to render link previews. */
export function renderOgImage(title: string, subtitle?: string) {
  return new ImageResponse(cardElement(title, subtitle), {
    ...OG_SIZE,
    headers: { 'X-Robots-Tag': 'noindex' },
  });
}

/** Same card, sized 16:9 — for callers that need a specific size/aspect
 *  ratio (blog/[slug]/cover.webp converts this to WebP for BlogPosting.image,
 *  brief Lot 2.6) rather than the OG-convention 1.91:1. */
export function renderCardImage(
  title: string,
  subtitle: string | undefined,
  size: { width: number; height: number }
) {
  return new ImageResponse(cardElement(title, subtitle), { ...size });
}
