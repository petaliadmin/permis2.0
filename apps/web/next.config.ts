import type { NextConfig } from 'next';

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

export default nextConfig;
