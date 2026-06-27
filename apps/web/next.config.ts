import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
  webpack: (config) => {
    return config;
  },
};

export default withNextIntl(nextConfig);
