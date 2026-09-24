import type { Metadata } from 'next';
import Link from 'next/link';
import {
  IconUsers,
  IconEye,
  IconUsersGroup,
  IconLayoutDashboard,
  IconReceipt,
  IconUserCog,
  IconCalendar,
  IconChartBar,
  IconBolt,
  IconChevronRight,
} from '@tabler/icons-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { buildMetadata } from '@/lib/seo/metadata';
import { organizationNode, websiteNode, graphScript, SITE_URL } from '@/lib/seo/jsonLd';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata: Metadata = buildMetadata({
  title: 'Logiciel de gestion pour auto-école',
  description:
    "L'ERP PERMIS 2.0 pour auto-écoles au Sénégal : élèves, moniteurs, véhicules, planning et paiements dans un seul outil. 3 mois d'essai gratuit.",
  path: '/logiciel-gestion-auto-ecole',
});

const FEATURES = [
  { icon: IconUsers, label: 'Gestion des élèves', text: 'Dossiers, catégories de permis, suivi de progression et historique de paiement par élève.' },
  { icon: IconEye, label: 'Visibilité en ligne', text: "Fiche publique sur l'annuaire PERMIS 2.0, avec réception des pré-inscriptions directement dans votre tableau de bord." },
  { icon: IconUsersGroup, label: 'CRM', text: 'Suivi des demandes de pré-inscription, du premier contact à l\'inscription confirmée.' },
  { icon: IconUserCog, label: 'Gestion du personnel', text: 'Comptes moniteurs, secrétaires et gestionnaires avec des accès limités à leur rôle.' },
  { icon: IconCalendar, label: 'Planning', text: 'Séances de code et de conduite, par élève et par moniteur, sans double réservation.' },
  { icon: IconReceipt, label: 'Facturation', text: 'Factures et devis générés automatiquement, export PDF, suivi des paiements en attente.' },
  { icon: IconChartBar, label: 'Rapports', text: "Vue d'ensemble du nombre d'élèves actifs, du taux de remplissage du planning et des paiements du mois." },
  { icon: IconLayoutDashboard, label: 'Véhicules', text: 'Suivi de la flotte : immatriculation, disponibilité, entretien.' },
  { icon: IconBolt, label: 'Automatisation', text: "Les demandes de pré-inscription en ligne arrivent directement dans votre file d'attente, sans ressaisie." },
];

const FAQS = [
  {
    question: "Combien coûte le logiciel de gestion PERMIS 2.0 pour auto-écoles ?",
    answer:
      "L'abonnement mensuel est facturé au tarif affiché ci-dessous. Chaque nouvelle auto-école bénéficie de 3 mois d'essai gratuit avant la première facturation.",
  },
  {
    question: 'Faut-il une carte bancaire pour créer mon compte auto-école ?',
    answer:
      "Non. La création de compte et les 3 mois d'essai sont gratuits et sans engagement ; l'abonnement n'est activé qu'à la fin de la période d'essai, si vous choisissez de continuer.",
  },
  {
    question: 'Le logiciel remplace-t-il complètement mes outils actuels (Excel, cahier papier) ?',
    answer:
      "L'objectif est de centraliser ce qui est aujourd'hui réparti entre plusieurs outils : élèves, planning, facturation et visibilité en ligne dans un seul tableau de bord, accessible à toute votre équipe selon son rôle.",
  },
];

interface SubscriptionPlan {
  id: string;
  title: string;
  priceXof: number;
  type: string;
  active: boolean;
}

async function fetchSubscriptionPrice(): Promise<number | null> {
  try {
    const res = await fetch(`${API_URL}/subscriptions/plans?type=SCHOOL`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const plans: SubscriptionPlan[] = await res.json();
    const sub = plans.find((p) => p.active);
    return sub?.priceXof ?? null;
  } catch {
    return null;
  }
}

function jsonLd(priceXof: number | null): string {
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Logiciel de gestion auto-école',
        item: `${SITE_URL}/logiciel-gestion-auto-ecole`,
      },
    ],
  };
  const faqPage = {
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
  const software = {
    '@type': 'SoftwareApplication',
    name: 'PERMIS 2.0 — Logiciel de gestion pour auto-écoles',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `${SITE_URL}/logiciel-gestion-auto-ecole`,
    // Real price only — omitted entirely if the product catalog fetch
    // fails or the product isn't configured, never a guessed figure.
    ...(priceXof != null
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'XOF',
            price: priceXof,
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: priceXof,
              priceCurrency: 'XOF',
              unitCode: 'MON',
            },
          },
        }
      : {}),
  };
  return graphScript([organizationNode(), websiteNode(), breadcrumb, faqPage, software]);
}

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

export default async function LogicielGestionAutoEcolePage() {
  const priceXof = await fetchSubscriptionPrice();

  return (
    <div className="on-light min-h-screen bg-surface">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(priceXof) }} />

      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-foreground">
            Accueil
          </Link>
          <IconChevronRight size="1em" className="text-[10px]" aria-hidden="true" />
          <span className="text-foreground">Logiciel de gestion auto-école</span>
        </nav>

        <span className="chip chip-violet">Pour les auto-écoles</span>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Logiciel de gestion pour auto-école au Sénégal
        </h1>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-secondary sm:text-base">
          <p>
            PERMIS 2.0 propose un ERP pensé pour le quotidien d'une auto-école sénégalaise : élèves,
            moniteurs, véhicules, planning et paiements dans un seul tableau de bord, accessible
            depuis un ordinateur ou un téléphone. L'objectif est de remplacer les outils dispersés
            (cahier papier, feuilles Excel, groupes WhatsApp) par un système unique que toute
            l'équipe peut utiliser selon son rôle — direction, secrétariat, moniteurs.
          </p>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              Ce que le logiciel gère
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.label} className="rounded-2xl border border-token bg-surface-1 p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <f.icon size="1em" className="text-base" aria-hidden="true" />
                    </span>
                    <p className="font-display text-sm font-bold text-foreground">{f.label}</p>
                  </div>
                  <p className="mt-2 text-xs text-secondary">{f.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">Tarif</h2>
            {priceXof != null ? (
              <div className="mt-4 rounded-2xl border border-token bg-surface-1 p-6 text-center">
                <p className="font-display text-3xl font-extrabold text-primary-700">
                  {fmtXof(priceXof)}
                  <span className="text-base font-semibold text-secondary">/mois</span>
                </p>
                <p className="mt-2 text-sm text-secondary">
                  3 mois d'essai gratuit à la création de votre compte, sans carte bancaire.
                </p>
              </div>
            ) : (
              <p className="mt-3">
                Créez votre compte pour découvrir le tarif et démarrer votre essai gratuit de 3
                mois.
              </p>
            )}
            <Link
              href="/mon-ecole"
              className="btn-violet mt-4 inline-flex items-center gap-1.5"
            >
              Inscrire mon auto-école
              <IconChevronRight size="1em" aria-hidden="true" />
            </Link>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              Visibilité auprès des futurs élèves
            </h2>
            <p className="mt-3">
              Une fois inscrite, votre auto-école apparaît dans{' '}
              <Link href="/ecoles" className="font-semibold text-primary-600 hover:underline">
                l'annuaire public PERMIS 2.0
              </Link>{' '}
              — les candidats au permis peuvent consulter vos services, vos tarifs et vous envoyer
              une pré-inscription en ligne directement depuis leur téléphone. Ces demandes arrivent
              automatiquement dans votre tableau de bord, sans ressaisie.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">Questions fréquentes</h2>
            <div className="mt-4 space-y-4">
              {FAQS.map((f) => (
                <div key={f.question}>
                  <h3 className="font-display text-sm font-bold text-foreground">{f.question}</h3>
                  <p className="mt-1.5 text-sm text-secondary">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-3 rounded-2xl bg-primary-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-sm font-bold text-primary-700">
              Prêt à essayer gratuitement pendant 3 mois ?
            </p>
            <Link href="/mon-ecole" className="btn-primary shrink-0 !py-2.5 text-sm">
              Créer mon compte
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
