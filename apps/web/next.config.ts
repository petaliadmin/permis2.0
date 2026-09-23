import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

const nextConfig: NextConfig = {
  output: 'standalone',
  // Audit sécurité (2026-09-23) — `X-Powered-By: Next.js` is on by default
  // and only tells an attacker which framework/version-family to target.
  poweredByHeader: false,
  experimental: {
    // Audit sécurité (2026-09-23) — signs every Next-emitted <script> with a
    // build-time integrity hash so a compromised CDN/edge can't silently
    // swap the JS payload; the browser refuses a modified file. Native to
    // Next 15.5+, so no manual hash generation/maintenance on each deploy.
    sri: { algorithm: 'sha384' },
  },
  // react-leaflet's MapContainer creates its Leaflet map instance imperatively
  // in a ref callback that isn't idempotent under React 18 Strict Mode's
  // dev-only double-invoke of effects — it throws "Map container is already
  // initialized" and takes down the whole /ecoles page. Strict Mode's extra
  // dev checks are useful, but a crashing map isn't an acceptable trade —
  // this has zero effect on production builds (double-invoke is dev-only).
  reactStrictMode: false,
  transpilePackages: [
    '@permis2.0/types',
    '@permis2.0/utils',
    '@permis2.0/hooks',
    '@permis2.0/ui',
    '@permis2.0/shared',
  ],
  images: {
    formats: ['image/avif', 'image/webp'],
    // Default is 60s, which forces the (expensive) optimizer to re-run on
    // almost every request instead of serving a cached variant — confirmed
    // in prod via `Cache-Control: max-age=60, must-revalidate` + `X-Nextjs-Cache: MISS`
    // on the hero image, the page's LCP element. These are static assets
    // under public/ that only change on redeploy, so cache them for a year.
    minimumCacheTTL: 31536000,
    // Étape 7 (audit) — Next's default deviceSizes tops out at 3840w; a
    // cache-miss on that size measured 29s to generate. This app targets
    // low-end mobile on constrained Senegalese networks (brief rule 6) —
    // nothing here needs a 4K/ultra-wide variant. 1920w covers real desktop
    // viewports; dropping the largest two tiers also means fewer sizes to
    // pre-warm after a deploy.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  async headers() {
    // Lot 1.6 (SEO brief) — these routes read no per-visitor state (no auth,
    // no cart, nothing keyed by cookie), but Next.js still serves them
    // `no-store`: the root layout reads `headers()` for www/learn/school/
    // admin space detection, which makes Next treat the *entire* render tree
    // as dynamic, overriding any page-level ISR/static config. Rather than
    // restructure that (a bigger change — see PR notes) or enable
    // experimental PPR, these config-level header overrides apply
    // regardless of the route's static/dynamic classification, same as the
    // security headers below already do. Caddy's `cache` directive (Souin)
    // respects whatever Cache-Control the origin sends, keyed by host+path —
    // a cache respecting Host doesn't risk serving www's response to learn/
    // school/admin (whose own responses stay `no-store` — only www's
    // editorial/panneaux/blog routes are listed here).
    const CACHEABLE_CONTENT_ROUTES = [
      '/traffic-signs/:path*',
      '/a-propos',
      '/code-route-senegal',
      '/permis-conduire-senegal',
      '/prix-permis-conduire-senegal',
      '/logiciel-gestion-auto-ecole',
      '/auto-ecoles-senegal',
      '/auto-ecoles-senegal/:path*',
      '/ecoles',
      '/mentions-legales',
      '/politique-confidentialite',
      '/assistance',
      '/contact',
    ];
    // /blog is DB-backed and editable any time from /admin/articles (unlike
    // the routes above, which only change on a deploy) — a much shorter
    // s-maxage keeps a published/edited article from being invisible behind
    // Caddy's edge cache for up to an hour.
    const BLOG_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=3600';
    // `/` is deliberately NOT here despite the audit flagging it: this path
    // is shared across all four hosts (www/learn/school/admin — see
    // middleware.ts), and unlike the routes above, learn's and school's `/`
    // render each viewer's OWN dashboard (StudentHome / GestionClient),
    // not identical content. A path-only Cache-Control match here would
    // apply to every host and risk one school's/student's dashboard being
    // served from cache to a different viewer. www's `/` would need a
    // space-aware matcher (or its own route) to cache safely — out of
    // scope for this pass.
    return [
      ...CACHEABLE_CONTENT_ROUTES.map((source) => ({
        source,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      })),
      {
        source: '/blog/:path*',
        headers: [{ key: 'Cache-Control', value: BLOG_CACHE_CONTROL }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // geolocation=(self) — needed by the "Autour de moi" sort on
            // /ecoles; camera/microphone stay locked, unused by the app.
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          // Étape 7 (audit) — every external origin here is real and
          // currently loaded, checked against the source, not guessed:
          // googletagmanager.com (GoogleAnalytics.tsx), google-analytics.com
          // (the gtag beacon), tile.openstreetmap.org (SchoolsMap.tsx's
          // Leaflet TileLayer), and the API's own origin (NEXT_PUBLIC_API_URL
          // — a different subdomain in prod, api.permis2.com). `unsafe-inline`
          // on script/style is required by Next's own hydration scripts and
          // Tailwind's inline styles — removing it needs a nonce-based setup,
          // a bigger change than this pass. Only applied in production:
          // Next's dev-mode HMR needs `unsafe-eval`, which this deliberately
          // doesn't grant.
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Content-Security-Policy',
                  value: [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
                    "style-src 'self' 'unsafe-inline'",
                    "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
                    "font-src 'self' data:",
                    `connect-src 'self' https://www.google-analytics.com https://analytics.google.com ${
                      process.env.NEXT_PUBLIC_API_URL || 'https://api.permis2.com'
                    }`,
                    "frame-ancestors 'self'",
                    "base-uri 'self'",
                    "form-action 'self'",
                  ].join('; '),
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
