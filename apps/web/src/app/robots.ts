import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.permis2.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/', '/auth/', '/notifications', '/profil'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
