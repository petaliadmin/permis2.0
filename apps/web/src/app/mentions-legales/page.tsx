import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WHATSAPP_DISPLAY, CONTACT_EMAIL } from '@/lib/contact';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Mentions légales',
  description: 'Mentions légales de la plateforme PERMIS 2.0.',
  path: '/mentions-legales',
  robots: { index: true, follow: true },
});

/**
 * Version "startup en démarrage" : pas de raison sociale/RCCM/NINEA affichés
 * tant que la structure n'est pas formellement immatriculée. À enrichir avec
 * ces informations dès l'immatriculation (elles deviennent alors obligatoires
 * en droit sénégalais pour un site marchand/à comptes utilisateurs).
 */
export default function MentionsLegalesPage() {
  return (
    <div className="on-light min-h-screen bg-surface">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Mentions légales
        </h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-secondary sm:text-base">
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">Éditeur du site</h2>
            <p className="mt-2">
              Le site et l'application PERMIS 2.0 (permis2.com) sont édités par l'équipe PERMIS
              2.0, basée à Dakar, Sénégal.
            </p>
            <p className="mt-2">Directeur de la publication : l'équipe PERMIS 2.0.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-foreground">Hébergement</h2>
            <p className="mt-2">
              Le site est hébergé sur une infrastructure cloud Amazon Web Services (AWS). Le nom
              de domaine permis2.com est enregistré auprès d'un bureau d'enregistrement tiers.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-foreground">Contact</h2>
            <p className="mt-2">
              Pour toute question relative à ces mentions légales, contactez-nous par email à{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-600 hover:underline">
                {CONTACT_EMAIL}
              </a>
              , sur WhatsApp au {WHATSAPP_DISPLAY}, ou via notre page{' '}
              <a href="/contact" className="font-semibold text-primary-600 hover:underline">
                Contact
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-foreground">Propriété intellectuelle</h2>
            <p className="mt-2">
              L'ensemble des contenus présents sur PERMIS 2.0 (textes, illustrations, panneaux,
              questions de quiz, logo, charte graphique) est protégé au titre du droit d'auteur.
              Toute reproduction ou représentation, totale ou partielle, sans autorisation
              préalable est interdite.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-foreground">Nature du contenu</h2>
            <p className="mt-2">
              Les contenus pédagogiques (code de la route, panneaux, quiz, examens blancs)
              proposés sur PERMIS 2.0 ont une vocation d'entraînement et d'information générale.
              Ils ne constituent pas une source réglementaire officielle. Voir également notre
              page{' '}
              <a href="/politique-confidentialite" className="font-semibold text-primary-600 hover:underline">
                Politique de confidentialité
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
