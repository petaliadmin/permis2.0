import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

const SITE_URL = 'https://www.permis2.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata: Metadata = {
  title: 'Permis de conduire au Sénégal — Catégories, préparation, auto-écoles',
  description:
    'Catégories de permis (A à E), étapes de préparation, Code de la route et examen : tout savoir pour préparer son permis de conduire au Sénégal et trouver son auto-école.',
  alternates: { canonical: '/permis-conduire-senegal' },
};

const CATEGORIES = [
  { code: 'A', label: 'Motos et scooters' },
  { code: 'B', label: 'Véhicules légers (voiture particulière)' },
  { code: 'C', label: 'Poids lourds' },
  { code: 'D', label: 'Transport en commun' },
  { code: 'E', label: 'Remorques et attelages' },
];

async function fetchStartingPrice(): Promise<number | null> {
  try {
    const res = await fetch(`${API_URL}/schools?take=50`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const schools = (await res.json()) as { priceXof?: number | null }[];
    const prices = schools.map((s) => s.priceXof).filter((p): p is number => p != null);
    return prices.length > 0 ? Math.min(...prices) : null;
  } catch {
    return null;
  }
}

const FAQS = [
  {
    question: 'Quelle est la différence entre le Code de la route et le permis de conduire ?',
    answer:
      "Le Code de la route est l'épreuve théorique : elle vérifie la connaissance des règles et de la signalisation. Le permis de conduire s'obtient après avoir réussi le Code puis l'épreuve pratique de conduite avec une auto-école.",
  },
  {
    question: 'Combien de temps faut-il pour obtenir son permis ?',
    answer:
      "Cela dépend de l'auto-école choisie, de la catégorie visée et de la disponibilité du candidat pour les séances de code et de conduite. Chaque auto-école partenaire peut donner une estimation précise selon votre situation.",
  },
  {
    question: "Quel est l'âge minimum pour passer le permis au Sénégal ?",
    answer:
      "L'âge minimum et les conditions d'accès dépendent de la catégorie de permis visée et sont fixés par la réglementation sénégalaise. Votre auto-école pourra vous confirmer les conditions applicables à votre cas.",
  },
  {
    question: 'Comment choisir une bonne auto-école au Sénégal ?',
    answer:
      "Comparez les services proposés, les tarifs, la localisation et les catégories de permis disponibles. Notre annuaire d'auto-écoles partenaires permet de comparer ces critères avant de se pré-inscrire en ligne.",
  },
];

function jsonLd() {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Permis de conduire',
        item: `${SITE_URL}/permis-conduire-senegal`,
      },
    ],
  };
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
  return [breadcrumb, faqPage];
}

export default async function PermisConduireSenegalPage() {
  const startingPrice = await fetchStartingPrice();

  return (
    <div className="on-light min-h-screen bg-surface">
      {jsonLd().map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-foreground">
            Accueil
          </Link>
          <i className="ti ti-chevron-right text-[10px]" aria-hidden="true" />
          <span className="text-foreground">Permis de conduire</span>
        </nav>

        <span className="chip chip-primary">Sénégal</span>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Permis de conduire au Sénégal
        </h1>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-secondary sm:text-base">
          <p>
            Pour obtenir son permis de conduire au Sénégal, un candidat suit une formation dans
            une auto-école, prépare et réussit l'examen du Code de la route, puis passe l'épreuve
            pratique de conduite. PERMIS 2.0 accompagne cette préparation avec des leçons, un
            annuaire de panneaux, des quiz corrigés et un annuaire d'auto-écoles partenaires pour
            se pré-inscrire en ligne.
          </p>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              Les catégories de permis de conduire
            </h2>
            <p className="mt-3">
              Les auto-écoles partenaires de PERMIS 2.0 proposent généralement les catégories
              suivantes. Les conditions d'accès exactes (âge, prérequis) sont fixées par la
              réglementation sénégalaise — renseignez-vous auprès de l'auto-école ou des services
              compétents pour votre situation.
            </p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {CATEGORIES.map(({ code, label }) => (
                <div
                  key={code}
                  className="flex items-center gap-3 rounded-2xl border border-token bg-surface-1 px-4 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 font-display text-sm font-black text-primary-600">
                    {code}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              Les étapes pour préparer son permis
            </h2>
            <ol className="mt-4 space-y-3">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-black text-primary-600">
                  1
                </span>
                <span>
                  <strong className="text-foreground">Choisissez une auto-école</strong> dans notre{' '}
                  <Link href="/ecoles" className="font-semibold text-primary-600 hover:underline">
                    annuaire d'auto-écoles
                  </Link>{' '}
                  et pré-inscrivez-vous en ligne.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-black text-primary-600">
                  2
                </span>
                <span>
                  <strong className="text-foreground">Préparez le Code de la route</strong> avec
                  les{' '}
                  <Link href="/cours" className="font-semibold text-primary-600 hover:underline">
                    leçons
                  </Link>{' '}
                  et l'
                  <Link
                    href="/code-route-senegal"
                    className="font-semibold text-primary-600 hover:underline"
                  >
                    annuaire des panneaux
                  </Link>
                  .
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-black text-primary-600">
                  3
                </span>
                <span>
                  <strong className="text-foreground">Entraînez-vous</strong> avec des{' '}
                  <Link href="/quizz" className="font-semibold text-primary-600 hover:underline">
                    quiz
                  </Link>{' '}
                  puis un{' '}
                  <Link href="/exam" className="font-semibold text-primary-600 hover:underline">
                    examen blanc
                  </Link>{' '}
                  dans les conditions du jour J.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-black text-primary-600">
                  4
                </span>
                <span>
                  <strong className="text-foreground">Passez l'examen du Code</strong> puis
                  l'épreuve pratique de conduite avec votre auto-école.
                </span>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              Combien coûte le permis au Sénégal ?
            </h2>
            <p className="mt-3">
              Le tarif dépend de l'auto-école, de la ville et de la catégorie de permis visée.
              {startingPrice != null && (
                <>
                  {' '}
                  Sur PERMIS 2.0, les formations affichées par nos auto-écoles partenaires
                  démarrent à partir de{' '}
                  <strong className="text-foreground">
                    {startingPrice.toLocaleString('fr-FR')} FCFA
                  </strong>
                  .
                </>
              )}{' '}
              Ce tarif couvre la formation proposée par l'auto-école ; il ne comprend pas
              d'éventuels frais administratifs officiels, à vérifier directement auprès des
              services compétents.
            </p>
            <Link
              href="/ecoles"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:underline"
            >
              Comparer les auto-écoles
              <i className="ti ti-arrow-right" aria-hidden="true" />
            </Link>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              Information pédagogique, pas une source officielle
            </h2>
            <p className="mt-3">
              PERMIS 2.0 est un outil de préparation et de mise en relation avec des auto-écoles —
              il ne représente pas les autorités sénégalaises compétentes en matière de permis de
              conduire. Pour toute démarche administrative officielle, référez-vous aux services
              compétents de l'État du Sénégal. Voir aussi notre page{' '}
              <Link href="/a-propos" className="font-semibold text-primary-600 hover:underline">
                À propos
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">Questions fréquentes</h2>
            <div className="mt-4 space-y-4">
              {FAQS.map((f) => (
                <div key={f.question}>
                  <p className="font-display text-sm font-bold text-foreground">{f.question}</p>
                  <p className="mt-1.5 text-sm text-secondary">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-3 rounded-2xl bg-primary-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-sm font-bold text-primary-700">
              Prêt à commencer votre préparation ?
            </p>
            <Link href="/onboarding" className="btn-primary shrink-0 !py-2.5 text-sm">
              Créer mon compte gratuit
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
