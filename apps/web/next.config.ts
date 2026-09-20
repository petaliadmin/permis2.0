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
    return [
      {
        // Self-hosted icon webfont — content-addressed by version in the vendor
        // package, safe to cache aggressively (a version bump changes the path).
        source: '/fonts/tabler-icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
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
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
