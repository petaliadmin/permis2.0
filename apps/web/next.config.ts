import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

const nextConfig: NextConfig = {
  output: 'standalone',
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
  },
  async headers() {
    // Lot 1.6 (SEO brief) — these routes read no per-visitor state (no auth,
    // no cart, nothing keyed by cookie) and their content only changes on a
    // deploy or a backend data update, but Next.js still serves them
    // `no-store`: the root layout reads `headers()` for www/learn/school/
    // admin space detection, which makes Next treat the *entire* render tree
    // as dynamic, overriding any page-level ISR/static config. Rather than
    // restructure that (a bigger change — see PR notes) or enable
    // experimental PPR, these config-level header overrides apply
    // regardless of the route's static/dynamic classification, same as the
    // security headers below already do. Safe today because Caddy in front
    // of this app has no cache layer at all yet (plain `reverse_proxy`, see
    // Caddyfile) — nothing can misuse the header until one is added, and a
    // standard HTTP cache keys by host+path, not path alone, so a future
    // cache respecting Host doesn't risk serving www's response to learn/
    // school/admin (whose own responses stay `no-store` — only www's
    // editorial/panneaux/blog routes are listed here).
    const CACHEABLE_CONTENT_ROUTES = [
      '/traffic-signs/:path*',
      '/blog/:path*',
      '/a-propos',
      '/code-route-senegal',
      '/permis-conduire-senegal',
      '/auto-ecoles-senegal',
      '/mentions-legales',
      '/politique-confidentialite',
      '/assistance',
      '/contact',
    ];
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
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
