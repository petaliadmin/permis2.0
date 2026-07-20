import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans, Baloo_2 } from 'next/font/google';
import { APP_NAME, APP_SLOGAN } from '@permis2.0/shared';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { ThemeInit } from '@/components/ThemeInit';
import { PushPermissionBanner } from '@/components/PushPermissionBanner';
import { EntitlementProvider } from '@/components/EntitlementProvider';

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
  'Préparez le code de la route et l’examen du permis de conduire au Sénégal : leçons, panneaux de signalisation, séries de quiz et examens blancs, en français et en wolof.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${APP_NAME} — Code de la route Sénégal`, template: `%s · ${APP_NAME}` },
  description: SEO_DESCRIPTION,
  keywords: [
    'code de la route Sénégal',
    'permis de conduire Sénégal',
    'examen du permis',
    'quiz code de la route',
    'panneaux de signalisation',
    'examen blanc permis',
    'auto-école Sénégal',
  ],
  applicationName: APP_NAME,
  manifest: '/manifest.json',
  alternates: { canonical: '/' },
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: APP_NAME,
  url: SITE_URL,
  description: SEO_DESCRIPTION,
  inLanguage: 'fr-SN',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [{ color: '#2563eb' }],
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Dark theme is the default across the app — the `dark` class is applied
    // server-side too so first paint is dark, not a light-then-dark flash.
    // ThemeInit reconciles with a persisted 'light'/'system' choice on mount.
    <html
      lang="fr"
      className={`dark ${inter.variable} ${jakarta.variable} ${baloo.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
        {/* Basic WebSite structured data — sitelinks searchbox eligibility */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-surface text-foreground font-sans antialiased">
        {/* ThemeInit applies the persisted choice after hydration */}
        <ThemeInit />
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
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
