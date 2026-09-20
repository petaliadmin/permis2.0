import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'À propos',
  // Lot 2.1 — was 166 chars (over the 140-160 target).
  description:
    "PERMIS 2.0 est une plateforme sénégalaise de préparation au permis : code de la route, panneaux, quiz, examens blancs et annuaire d'auto-écoles.",
  alternates: { canonical: '/a-propos' },
};

export default function AProposPage() {
  return (
    <div className="on-light min-h-screen bg-surface">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          À propos de PERMIS 2.0
        </h1>

        <div className="mt-8 max-w-none space-y-6 text-sm leading-relaxed text-secondary sm:text-base">
          <p>
            <strong className="text-foreground">PERMIS 2.0</strong> est une plateforme numérique
            sénégalaise qui aide les candidats au permis de conduire à préparer le code de la
            route et à trouver une auto-école, et qui donne aux auto-écoles un outil simple pour
            gérer leurs élèves, leur équipe et leur planning.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground">Notre mission</h2>
          <p>
            Rendre la préparation au permis plus accessible partout au Sénégal : réviser le code
            de la route à son rythme, s'entraîner avec des quiz et des examens blancs, apprendre à
            reconnaître les panneaux de signalisation, puis se pré-inscrire en ligne auprès d'une
            auto-école partenaire.
          </p>

          <h2 className="font-display text-xl font-bold text-foreground">Ce que propose PERMIS 2.0</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Des leçons et un annuaire de panneaux du code de la route sénégalais.</li>
            <li>Des séries de quiz et des examens blancs pour s'auto-évaluer.</li>
            <li>Un annuaire d'auto-écoles avec pré-inscription en ligne.</li>
            <li>
              Un espace de gestion pour les auto-écoles (élèves, moniteurs, planning, paiements).
            </li>
          </ul>

          <h2 className="font-display text-xl font-bold text-foreground">
            Contenu pédagogique, pas une source officielle
          </h2>
          <p>
            PERMIS 2.0 est un outil pédagogique d'entraînement — il ne remplace pas et ne
            représente pas les autorités sénégalaises compétentes en matière de permis de
            conduire. Pour toute démarche administrative ou question réglementaire officielle,
            référez-vous aux services compétents de l'État du Sénégal.
          </p>

          <p>
            Une question, une remarque ? Rendez-vous sur notre page{' '}
            <Link href="/contact" className="font-semibold text-primary-600 hover:underline">
              Contact
            </Link>{' '}
            ou consultez notre{' '}
            <Link href="/assistance" className="font-semibold text-primary-600 hover:underline">
              FAQ
            </Link>
            .
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
