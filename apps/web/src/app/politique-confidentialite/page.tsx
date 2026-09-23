import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WHATSAPP_DISPLAY, CONTACT_EMAIL } from '@/lib/contact';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Politique de confidentialité',
  description:
    'Comment PERMIS 2.0 collecte, utilise et protège vos données personnelles, conformément à la loi sénégalaise sur la protection des données.',
  path: '/politique-confidentialite',
});

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="on-light min-h-screen bg-surface">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Politique de confidentialité
        </h1>
        <p className="mt-3 text-xs text-muted">Dernière mise à jour : à compléter avant publication</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-secondary sm:text-base">
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">Données que nous collectons</h2>
            <p className="mt-2">
              Pour créer un compte et utiliser PERMIS 2.0, nous collectons notamment : votre nom,
              votre numéro de téléphone, votre progression sur les leçons, quiz et examens blancs,
              et, si vous vous pré-inscrivez auprès d'une auto-école ou souscrivez à un
              abonnement, les informations nécessaires au traitement de cette demande ou de ce
              paiement.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-foreground">
              Pourquoi nous les utilisons
            </h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Faire fonctionner votre compte et sauvegarder votre progression.</li>
              <li>Mettre en relation les élèves et les auto-écoles pour la pré-inscription.</li>
              <li>Vous envoyer des notifications liées à votre activité (rappels, statut de vos demandes).</li>
              <li>Assurer la sécurité de la plateforme et prévenir les fraudes.</li>
              <li>Mesurer l'usage du site à des fins d'amélioration (statistiques d'audience anonymisées).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-foreground">Partage des données</h2>
            <p className="mt-2">
              Vos données ne sont jamais vendues. Elles sont partagées uniquement avec l'auto-école
              auprès de laquelle vous vous pré-inscrivez (dans le cadre de cette inscription), et
              avec nos prestataires techniques strictement nécessaires au fonctionnement du
              service (hébergement, paiement, notifications).
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-foreground">Vos droits</h2>
            <p className="mt-2">
              Conformément à la loi sénégalaise n° 2008-12 du 25 janvier 2008 portant sur la
              protection des données à caractère personnel, vous disposez d'un droit d'accès, de
              rectification, d'opposition et de suppression de vos données personnelles. Pour
              exercer ces droits, contactez-nous par email à{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-600 hover:underline">
                {CONTACT_EMAIL}
              </a>{' '}
              ou sur WhatsApp au {WHATSAPP_DISPLAY}. Vous pouvez également adresser une
              réclamation à la Commission de protection des données personnelles (CDP) du
              Sénégal.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-foreground">Conservation et sécurité</h2>
            <p className="mt-2">
              Vos données sont conservées le temps nécessaire à l'utilisation du service et
              stockées sur une infrastructure sécurisée. Vous pouvez demander la suppression de
              votre compte à tout moment.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
