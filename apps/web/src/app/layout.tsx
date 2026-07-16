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

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_SLOGAN,
  applicationName: APP_NAME,
  manifest: '/manifest.json',
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
    // Light edtech theme is the default across the app.
    <html
      lang="fr"
      className={`${inter.variable} ${jakarta.variable} ${baloo.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
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
