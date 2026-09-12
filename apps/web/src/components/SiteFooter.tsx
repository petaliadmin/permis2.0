import Link from 'next/link';
import { WHATSAPP_DISPLAY } from '@/lib/contact';

/** Shared footer for full-width marketing pages — outside AppShell. */
export function SiteFooter() {
  return (
    <footer className="border-t border-token bg-surface-1">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-4">
          <div>
            <p className="font-display text-base font-extrabold text-foreground">
              PERMIS<span className="text-primary-600">2.0</span>
            </p>
            <p className="mt-2 text-sm text-secondary">
              La plateforme de référence pour préparer son permis et trouver son auto-école au
              Sénégal.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Découvrir</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/permis-conduire-senegal" className="text-secondary hover:text-foreground">
                  Permis de conduire Sénégal
                </Link>
              </li>
              <li>
                <Link href="/auto-ecoles-senegal" className="text-secondary hover:text-foreground">
                  Auto-écoles Sénégal
                </Link>
              </li>
              <li>
                <Link href="/ecoles" className="text-secondary hover:text-foreground">
                  Trouver une auto-école
                </Link>
              </li>
              <li>
                <Link href="/code-route-senegal" className="text-secondary hover:text-foreground">
                  Code de la route Sénégal
                </Link>
              </li>
              <li>
                <Link href="/traffic-signs" className="text-secondary hover:text-foreground">
                  Réviser le code
                </Link>
              </li>
              <li>
                <Link href="/exam" className="text-secondary hover:text-foreground">
                  Examens blancs
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-secondary hover:text-foreground">
                  Blog & conseils
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Assistance</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/assistance" className="text-secondary hover:text-foreground">
                  Contact & FAQ
                </Link>
              </li>
              <li className="text-secondary">WhatsApp · {WHATSAPP_DISPLAY}</li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">À propos</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/a-propos" className="text-secondary hover:text-foreground">
                  Qui sommes-nous
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-secondary hover:text-foreground">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="text-secondary hover:text-foreground">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/politique-confidentialite" className="text-secondary hover:text-foreground">
                  Confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          © {new Date().getFullYear()} PERMIS 2.0 · Fait avec ❤️ à Dakar
        </p>
      </div>
    </footer>
  );
}
