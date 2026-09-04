import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const VALUE_PROPS = [
  'Comparez les auto-écoles et leurs prix',
  'Révisez le code avec des quiz illimités',
  'Suivez votre formation en temps réel',
];

/**
 * Shared split-screen shell for every /auth/* page (login, register,
 * reset-pin, forgot/reset-password) — full-page image + form, in the same
 * light theme as the marketing site instead of each page rolling its own
 * full-bleed gradient background. Individual pages only render their form
 * content; brand, back-to-home link and visual identity live here once.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="on-light flex min-h-[100dvh] bg-surface">
      {/* Image panel — desktop only. Carries the brand + pitch so the form
          side can stay focused on the task at hand. */}
      <div className="relative hidden w-[42%] shrink-0 lg:block">
        <Image
          src="/images/hero.png"
          alt="Un élève sénégalais reçoit son permis des mains de son moniteur, devant le véhicule de l'auto-école"
          fill
          priority
          sizes="42vw"
          className="object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-primary-900/70 to-primary-900/20" />

        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-sm font-black backdrop-blur">
              P
            </span>
            <span className="font-display text-sm font-extrabold">
              PERMIS<span className="text-primary-200">2.0</span>
            </span>
          </Link>

          <div>
            <h2 className="font-display text-3xl font-extrabold leading-[1.15]">
              Votre permis de conduire, en toute confiance
            </h2>
            <ul className="mt-6 space-y-2.5">
              {VALUE_PROPS.map((v) => (
                <li key={v} className="flex items-center gap-2.5 text-sm text-white/85">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <i className="ti ti-check text-xs" aria-hidden="true" />
                  </span>
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 flex-col">
        <div className="flex items-center justify-between px-5 pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-10 sm:pt-8">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-xs font-black text-white">
              P
            </span>
            <span className="font-display text-sm font-extrabold text-foreground">
              PERMIS<span className="text-primary-600">2.0</span>
            </span>
          </Link>
          <Link
            href="/"
            className="ml-auto flex items-center gap-1 text-sm font-semibold text-secondary hover:text-foreground"
          >
            <i className="ti ti-arrow-left" aria-hidden="true" />
            Retour à l&apos;accueil
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 sm:px-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
