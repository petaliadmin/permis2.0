import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans, Baloo_2 } from 'next/font/google';
import { APP_NAME, APP_SLOGAN } from '@permis2.0/shared';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { ThemeInit } from '@/components/ThemeInit';
import { OnboardingGate } from '@/components/OnboardingGate';
import { PushPermissionBanner } from '@/components/PushPermissionBanner';
import { EntitlementProvider } from '@/components/EntitlementProvider';
import { SpaceProvider } from '@/components/SpaceProvider';
import { SessionSync } from '@/components/SessionSync';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { headers } from 'next/headers';
import { spaceFromHost, type Space } from '@/lib/space';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

// Baloo 2 — rounded, friendly display face used for headings, scores and rewards.
const baloo = Baloo_2({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-baloo',
  display: 'swap',
});

const SITE_URL = 'https://www.permis2.com';
const SEO_DESCRIPTION =
  'PERMIS 2.0 : préparez votre permis et le code de la route au Sénégal — leçons, panneaux de signalisation, séries de quiz et examens blancs, en français et en wolof. Élèves et auto-écoles du Sénégal.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${APP_NAME} — Code de la route Sénégal`, template: `%s · ${APP_NAME}` },
  description: SEO_DESCRIPTION,
  keywords: [
    'permis',
    'permis Sénégal',
    'code de la route',
    'code de la route Sénégal',
    'permis de conduire Sénégal',
    'examen du permis',
    'quiz code de la route',
    'panneaux de signalisation',
    'examen blanc permis',
    'auto-école',
    'auto-école Sénégal',
    'auto-écoles Sénégal',
  ],
  applicationName: APP_NAME,
  manifest: '/manifest.json',
  alternates: { canonical: '/' },
  verification: {
    google: [
      'dmRztJ-JkfX2AjwBovRsv6s56g7GlanGMCi69guMWSs',
      'ezrE2BeEk3wnpihGaujlfiR3WE2OAkjc9mFEosmwTCo',
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_SN',
    url: SITE_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Code de la route Sénégal`,
    description: SEO_DESCRIPTION,
    images: [{ url: '/images/home/header.png', width: 1448, height: 754, alt: APP_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — Code de la route Sénégal`,
    description: SEO_DESCRIPTION,
    images: ['/images/home/header.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: { telephone: false },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: APP_NAME,
  url: SITE_URL,
  description: SEO_DESCRIPTION,
  inLanguage: 'fr-SN',
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: APP_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/apple-touch-icon.png`,
  description: SEO_DESCRIPTION,
  areaServed: { '@type': 'Country', name: 'Sénégal' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [{ color: '#003ea8' }],
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const space: Space = (h.get('x-permis-space') as Space) || spaceFromHost(h.get('host'));

  return (
    // The app is light throughout (like the marketing site) — `body.on-light`
    // pins the light token palette for the whole tree. Immersive result
    // screens opt back into dark locally with `.on-ink`. `html.dark` is kept
    // only so any legacy `dark:` utility still has a defined baseline.
    <html
      lang="fr"
      className={`dark ${inter.variable} ${jakarta.variable} ${baloo.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Self-hosted (was a render-blocking cdn.jsdelivr.net stylesheet) — icons are
            used site-wide (nav, buttons) so the font is preloaded, not just linked. */}
        <link
          rel="preload"
          href="/fonts/tabler-icons/fonts/tabler-icons.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="/fonts/tabler-icons/tabler-icons.min.css" />

        {/* Basic WebSite structured data — sitelinks searchbox eligibility */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="on-light bg-surface text-foreground font-sans antialiased">
        <SpaceProvider space={space}>
          {/* ThemeInit applies the persisted choice after hydration */}
          <ThemeInit />
          <SessionSync />
          <OnboardingGate />
          {/* Skip link — keyboard navigation */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
          >
            Aller au contenu principal
          </a>
          <EntitlementProvider>{children}</EntitlementProvider>
          <InstallPrompt />
          <PushPermissionBanner />
        </SpaceProvider>
        <ServiceWorkerRegister />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
