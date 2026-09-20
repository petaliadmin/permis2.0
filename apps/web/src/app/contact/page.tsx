import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WHATSAPP_DISPLAY, whatsappLink } from '@/lib/contact';
import { IconBrandWhatsapp, IconMapPin } from '@tabler/icons-react';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    "Contactez l'équipe PERMIS 2.0 par WhatsApp pour toute question sur la préparation au permis, un abonnement ou votre auto-école.",
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="on-light min-h-screen bg-surface">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Contact
        </h1>
        <p className="mt-3 text-sm text-secondary sm:text-base">
          Une question sur votre préparation, votre auto-école ou votre abonnement ? Notre équipe
          vous répond sur WhatsApp.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href={whatsappLink('Bonjour, j\'ai une question sur PERMIS 2.0.')}
            target="_blank"
            rel="noopener noreferrer"
            className="card flex items-center gap-4 transition-colors hover:bg-surface-2"
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-2xl"
              aria-hidden="true"
            >
              <IconBrandWhatsapp size="1em" style={{ color: '#25D366' }} />
            </span>
            <span>
              <span className="block font-display text-sm font-bold text-foreground">
                WhatsApp
              </span>
              <span className="block text-sm text-secondary">{WHATSAPP_DISPLAY}</span>
            </span>
          </a>

          <div className="card flex items-center gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-2xl"
              aria-hidden="true"
            >
              <IconMapPin size="1em" style={{ color: '#003ea8' }} />
            </span>
            <span>
              <span className="block font-display text-sm font-bold text-foreground">
                Localisation
              </span>
              <span className="block text-sm text-secondary">Dakar, Sénégal</span>
            </span>
          </div>
        </div>

        <p className="mt-8 text-sm text-secondary">
          Vous cherchez une réponse rapide ? Consultez d'abord notre{' '}
          <Link href="/assistance" className="font-semibold text-primary-600 hover:underline">
            FAQ
          </Link>
          .
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
