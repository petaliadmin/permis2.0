import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { IconArrowRight, IconChevronRight } from '@tabler/icons-react';

const SITE_URL = 'https://www.permis2.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata: Metadata = {
  // Lot 2.1 — was 71 chars rendered (59 raw + suffix).
  title: 'Code de la route Sénégal — Cours, panneaux, quiz',
  description:
    'Apprenez le Code de la route sénégalais : panneaux, priorités, leçons thématiques et quiz corrigés pour préparer votre examen, gratuitement.',
  alternates: { canonical: '/code-route-senegal' },
};

const CAT_LABELS: Record<string, string> = {
  danger: 'Panneaux de danger',
  priorité: 'Panneaux de priorité',
  interdiction: "Panneaux d'interdiction",
  obligation: "Panneaux d'obligation",
  indication: "Panneaux d'indication",
};
// Display order + the 5 families shown in the app's own /traffic-signs listing
// (a handful of minor categories — temporaires, balises… — are grouped elsewhere in-app).
const CAT_ORDER = ['danger', 'priorité', 'interdiction', 'obligation', 'indication'];

interface SignCategoryCount {
  category: string;
  count: number;
}

async function fetchCategoryCounts(): Promise<{ total: number; byCategory: SignCategoryCount[] }> {
  try {
    const res = await fetch(`${API_URL}/traffic-signs?take=500`, { next: { revalidate: 86400 } });
    if (!res.ok) return { total: 0, byCategory: [] };
    const { data } = (await res.json()) as { data: { category: string }[] };
    const counts = new Map<string, number>();
    for (const s of data) counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
    const byCategory = CAT_ORDER.filter((c) => counts.has(c)).map((category) => ({
      category,
      count: counts.get(category) ?? 0,
    }));
    return { total: data.length, byCategory };
  } catch {
    return { total: 0, byCategory: [] };
  }
}

const FAQS = [
  {
    question: 'Le Code de la route sénégalais est-il différent des autres pays ?',
    answer:
      "Le Sénégal applique son propre Code de la route, mais sa signalisation suit les principes internationaux de la Convention de Vienne — un conducteur habitué aux panneaux d'autres pays francophones reconnaîtra donc l'essentiel des formes et couleurs, avec quelques panneaux et règles spécifiques au contexte sénégalais.",
  },
  {
    question: 'Réviser le Code de la route est-il gratuit sur PERMIS2.0 ?',
    answer:
      "Oui. La création de compte, les leçons, l'annuaire des panneaux et une partie des quiz sont gratuits. Les examens blancs complets et certaines séries avancées font partie de l'offre premium.",
  },
  {
    question: 'Combien de panneaux faut-il connaître pour l’examen ?',
    answer:
      "Notre base recense 155 panneaux répartis en plusieurs catégories (danger, priorité, interdiction, obligation, indication). Les réviser par catégorie, plutôt que tous en même temps, facilite la mémorisation.",
  },
  {
    question: 'Comment savoir si je suis prêt pour l’examen du Code ?',
    answer:
      "Un examen blanc dans les conditions réelles (temps limité, questions mélangées) est le meilleur indicateur : un score régulièrement au-dessus de 80 % sur plusieurs séries est un bon signe avant de se présenter à l'examen officiel.",
  },
];

function jsonLd(total: number) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Code de la route',
        item: `${SITE_URL}/code-route-senegal`,
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
  const course = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'Code de la route Sénégal — PERMIS 2.0',
    description: `Leçons thématiques, ${total || 155} panneaux de signalisation détaillés et quiz corrigés pour préparer le Code de la route au Sénégal.`,
    provider: { '@type': 'Organization', name: 'PERMIS2.0', sameAs: SITE_URL },
    url: `${SITE_URL}/code-route-senegal`,
  };
  return [breadcrumb, faqPage, course];
}

export default async function CodeRouteSenegalPage() {
  const { total, byCategory } = await fetchCategoryCounts();
  const signCount = total || 155;

  return (
    <div className="on-light min-h-screen bg-surface">
      {jsonLd(signCount).map((schema, i) => (
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
          <IconChevronRight size="1em" className="text-[10px]" aria-hidden="true" />
          <span className="text-foreground">Code de la route</span>
        </nav>

        <span className="chip chip-primary">Sénégal</span>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Code de la route au Sénégal
        </h1>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-secondary sm:text-base">
          <p>
            Le Code de la route sénégalais regroupe l'ensemble des règles de circulation, des
            panneaux de signalisation et des priorités que tout conducteur doit connaître pour
            circuler en sécurité et réussir l'examen du permis. Sur PERMIS 2.0, vous le révisez
            gratuitement grâce à des leçons thématiques, {signCount} panneaux détaillés et des
            quiz corrigés — sans avoir besoin d'une auto-école pour commencer.
          </p>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              Qu'est-ce que le Code de la route ?
            </h2>
            <p className="mt-3">
              C'est l'ensemble des règles qui organisent la circulation : signalisation, priorités
              aux intersections, vitesses, dépassement, stationnement et comportement à adopter
              selon les situations. L'examen du Code vérifie que le candidat connaît et sait
              appliquer ces règles avant de passer à l'épreuve pratique de conduite — voir notre
              page{' '}
              <Link
                href="/permis-conduire-senegal"
                className="font-semibold text-primary-600 hover:underline"
              >
                Permis de conduire au Sénégal
              </Link>{' '}
              pour le parcours complet.
            </p>
            <p className="mt-3">
              <strong className="text-foreground">Information pédagogique, pas réglementaire :</strong>{' '}
              les contenus de PERMIS 2.0 servent à s'entraîner. Pour toute démarche administrative
              ou question réglementaire officielle, référez-vous aux services compétents de l'État
              du Sénégal — voir notre page{' '}
              <Link href="/a-propos" className="font-semibold text-primary-600 hover:underline">
                À propos
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              Les panneaux de signalisation du Code sénégalais
            </h2>
            <p className="mt-3">
              Notre annuaire recense {signCount} panneaux, organisés par famille. Chaque panneau a
              sa propre fiche : signification, contexte d'usage, règle associée et conseils.
            </p>
            {byCategory.length > 0 && (
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {byCategory.map(({ category, count }) => (
                  <div
                    key={category}
                    className="rounded-2xl border border-token bg-surface-1 px-4 py-3"
                  >
                    <p className="font-display text-sm font-bold text-foreground">
                      {CAT_LABELS[category] ?? category}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{count} panneaux</p>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-4">
              Quelques panneaux à connaître en priorité :{' '}
              <Link href="/traffic-signs/stop-arret-obligatoire" className="font-semibold text-primary-600 hover:underline">
                STOP
              </Link>
              ,{' '}
              <Link href="/traffic-signs/cedez-le-passage" className="font-semibold text-primary-600 hover:underline">
                Cédez le passage
              </Link>
              ,{' '}
              <Link href="/traffic-signs/sens-interdit" className="font-semibold text-primary-600 hover:underline">
                Sens interdit
              </Link>
              ,{' '}
              <Link href="/traffic-signs/intersection-priorite-a-droite" className="font-semibold text-primary-600 hover:underline">
                Priorité à droite
              </Link>{' '}
              et{' '}
              <Link href="/traffic-signs/passage-pietons" className="font-semibold text-primary-600 hover:underline">
                Passage piétons
              </Link>
              .
            </p>
            <Link
              href="/traffic-signs"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:underline"
            >
              Voir tous les panneaux
              <IconArrowRight size="1em" aria-hidden="true" />
            </Link>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              Comment réviser le Code de la route avec PERMIS 2.0 ?
            </h2>
            <p className="mt-3">
              Pour progresser efficacement, suivez ces quatre étapes dans l'ordre :
            </p>
            <ol className="mt-4 space-y-3">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-black text-primary-600">
                  1
                </span>
                <span>
                  <strong className="text-foreground">Apprenez par thème</strong> avec les{' '}
                  <Link href="/cours" className="font-semibold text-primary-600 hover:underline">
                    leçons
                  </Link>{' '}
                  (priorités, vitesse, dépassement, stationnement…).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-black text-primary-600">
                  2
                </span>
                <span>
                  <strong className="text-foreground">Reconnaissez les panneaux</strong> grâce à
                  l'
                  <Link href="/traffic-signs" className="font-semibold text-primary-600 hover:underline">
                    annuaire des panneaux
                  </Link>
                  , classés par catégorie.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-black text-primary-600">
                  3
                </span>
                <span>
                  <strong className="text-foreground">Entraînez-vous</strong> avec les{' '}
                  <Link href="/quizz" className="font-semibold text-primary-600 hover:underline">
                    quiz corrigés
                  </Link>
                  , série par série.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-black text-primary-600">
                  4
                </span>
                <span>
                  <strong className="text-foreground">Validez votre niveau</strong> avec un{' '}
                  <Link href="/exam" className="font-semibold text-primary-600 hover:underline">
                    examen blanc
                  </Link>{' '}
                  dans les conditions du jour J.
                </span>
              </li>
            </ol>
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

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              Pour aller plus loin
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/blog/comprendre-priorites-circulation-senegal"
                className="rounded-full border border-token bg-surface-1 px-3.5 py-2 text-xs font-semibold text-primary-600 hover:bg-surface-2"
              >
                Tout comprendre sur les priorités de circulation
              </Link>
              <Link
                href="/blog/erreurs-frequentes-examen-code-route"
                className="rounded-full border border-token bg-surface-1 px-3.5 py-2 text-xs font-semibold text-primary-600 hover:bg-surface-2"
              >
                Les erreurs les plus fréquentes à l'examen
              </Link>
            </div>
          </section>

          <div className="flex flex-col gap-3 rounded-2xl bg-primary-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-sm font-bold text-primary-700">
              Prêt à commencer à réviser ?
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
