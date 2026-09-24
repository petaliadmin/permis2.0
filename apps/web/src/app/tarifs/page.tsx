import type { Metadata } from 'next';
import Link from 'next/link';
import { IconCards, IconClipboardCheck, IconCar, IconCalendar, IconChevronRight, IconCheck, IconRocket, IconBuildingStore } from '@tabler/icons-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { buildMetadata } from '@/lib/seo/metadata';
import { organizationNode, websiteNode, graphScript, SITE_URL } from '@/lib/seo/jsonLd';
import { fetchSubscriptionPlans, planByType, fmtXof } from '@/lib/fetchSubscriptionPlans';

export const metadata: Metadata = buildMetadata({
  title: 'Tarifs — Abonnement élève et auto-école',
  description:
    "Tous les tarifs PERMIS 2.0 : abonnement élève pour réviser le code de la route, et abonnement auto-école pour gérer élèves, planning et paiements, avec 3 mois d'essai gratuit.",
  path: '/tarifs',
});

const STUDENT_BENEFITS = [
  { icon: IconCards, text: 'Toutes les séries de quiz du Code' },
  { icon: IconClipboardCheck, text: 'Tous les examens blancs premium' },
  { icon: IconCar, text: 'Tous les cours de conduite' },
  { icon: IconCalendar, text: 'Accès illimité pendant toute la durée' },
];

const SCHOOL_BENEFITS = [
  'Élèves, équipe, véhicules et planning illimités',
  'Facturation et suivi des paiements',
  'Fiche visible dans l’annuaire public',
  'Réception des pré-inscriptions en ligne',
];

const FAQS = [
  {
    question: "Comment payer l'abonnement élève ou auto-école ?",
    answer:
      "Aujourd'hui, l'activation se fait par WhatsApp : vous nous contactez, réglez le montant, et notre équipe active votre accès en général en moins d'une heure. Le paiement par Orange Money et par carte bancaire arrive bientôt directement sur la plateforme.",
  },
  {
    question: "Puis-je essayer avant de payer ?",
    answer:
      "Le compte élève gratuit donne déjà accès à une partie du contenu (séries et examens gratuits) sans abonnement. Pour les auto-écoles, la création de compte s'accompagne de 3 mois d'essai gratuit sur l'espace de gestion, sans carte bancaire.",
  },
  {
    question: "Que se passe-t-il à la fin de mon abonnement ?",
    answer:
      "Vous perdez l'accès au contenu premium (ou à l'espace de gestion pour une auto-école) jusqu'au renouvellement — vos données et votre historique restent intacts, rien n'est supprimé.",
  },
  {
    question: "Qu'est-ce que le forfait Top 20 ?",
    answer:
      "Un forfait optionnel pour les auto-écoles déjà abonnées : votre fiche est mise en avant dans le Top 20 affiché sur la page d'accueil pendant 7 jours, pour gagner en visibilité auprès des futurs élèves.",
  },
];

function jsonLd(studentPriceXof: number | null, schoolPriceXof: number | null, featuredPriceXof: number | null) {
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Tarifs', item: `${SITE_URL}/tarifs` },
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
  // Real prices only — a plan omitted from the fetch (catalog fetch failure,
  // or admin-deactivated) is simply left out of the offer catalog, never a
  // guessed figure.
  const offers = [
    studentPriceXof != null && {
      '@type': 'Offer',
      name: 'Abonnement élève',
      priceCurrency: 'XOF',
      price: studentPriceXof,
      category: 'Subscription',
      url: `${SITE_URL}/abonnement`,
    },
    schoolPriceXof != null && {
      '@type': 'Offer',
      name: 'Abonnement auto-école',
      priceCurrency: 'XOF',
      price: schoolPriceXof,
      category: 'Subscription',
      url: `${SITE_URL}/logiciel-gestion-auto-ecole`,
    },
    featuredPriceXof != null && {
      '@type': 'Offer',
      name: 'Forfait Top 20',
      priceCurrency: 'XOF',
      price: featuredPriceXof,
      category: 'Subscription',
    },
  ].filter(Boolean);

  const itemList = offers.length > 0 && {
    '@type': 'OfferCatalog',
    name: 'Tarifs PERMIS 2.0',
    itemListElement: offers,
  };

  return graphScript(
    [organizationNode(), websiteNode(), breadcrumb, faqPage, itemList].filter(Boolean) as object[]
  );
}

export default async function TarifsPage() {
  const plans = await fetchSubscriptionPlans();
  const studentPlan = planByType(plans, 'STUDENT');
  const schoolPlan = planByType(plans, 'SCHOOL');
  const featuredPlan = planByType(plans, 'SCHOOL_FEATURED');
  const studentMonths = studentPlan ? Math.round(studentPlan.durationDays / 30) : 4;

  return (
    <div className="on-light min-h-screen bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            studentPlan?.priceXof ?? null,
            schoolPlan?.priceXof ?? null,
            featuredPlan?.priceXof ?? null
          ),
        }}
      />

      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-foreground">
            Accueil
          </Link>
          <IconChevronRight size="1em" className="text-[10px]" aria-hidden="true" />
          <span className="text-foreground">Tarifs</span>
        </nav>

        <span className="chip chip-orange">Tarifs</span>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Des tarifs simples, pour élèves et auto-écoles
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-secondary sm:text-base">
          Un compte gratuit pour commencer, un abonnement pour débloquer tout le contenu ou gérer
          votre auto-école au quotidien. Aucun engagement, activation immédiate après paiement.
        </p>

        {/* ── Élève ── */}
        <section className="mt-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <IconRocket size="1em" className="text-lg" aria-hidden="true" />
            </span>
            <h2 className="font-display text-xl font-bold text-foreground">Pour les élèves</h2>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-orange-200 bg-surface-1 shadow-card sm:flex">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 px-6 py-6 sm:w-64 sm:shrink-0">
              {studentPlan ? (
                <>
                  <div className="flex items-end gap-1.5">
                    <span className="font-display text-4xl font-black text-orange-600">
                      {fmtXof(studentPlan.priceXof)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-muted">/ {studentMonths} mois</span>
                  <p className="mt-2 text-xs text-orange-700/70">{studentPlan.description}</p>
                </>
              ) : (
                <p className="text-sm text-secondary">Contactez-nous pour connaître le tarif actuel.</p>
              )}
              <Link href="/abonnement" className="btn-primary mt-5 inline-flex w-full justify-center">
                S&apos;abonner
              </Link>
            </div>
            <ul className="grid flex-1 gap-3 px-6 py-6 sm:grid-cols-2">
              {STUDENT_BENEFITS.map((b) => (
                <li key={b.text} className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                    <b.icon size="1em" className="text-sm text-orange-600" aria-hidden="true" />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Auto-école ── */}
        <section className="mt-12">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <IconBuildingStore size="1em" className="text-lg" aria-hidden="true" />
            </span>
            <h2 className="font-display text-xl font-bold text-foreground">Pour les auto-écoles</h2>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="overflow-hidden rounded-3xl border border-violet-200 bg-surface-1 shadow-card">
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 px-6 py-6">
                {schoolPlan ? (
                  <>
                    <div className="flex items-end gap-1.5">
                      <span className="font-display text-3xl font-black text-violet-600">
                        {fmtXof(schoolPlan.priceXof)}
                      </span>
                      <span className="mb-1 text-sm font-semibold text-muted">/ mois</span>
                    </div>
                    <p className="mt-2 text-xs text-violet-700/70">{schoolPlan.description}</p>
                  </>
                ) : (
                  <p className="text-sm text-secondary">Contactez-nous pour connaître le tarif actuel.</p>
                )}
              </div>
              <ul className="space-y-2.5 px-6 py-5">
                {SCHOOL_BENEFITS.map((text) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100">
                      <IconCheck size="1em" className="text-xs text-violet-600" aria-hidden="true" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              <div className="px-6 pb-6">
                <Link href="/logiciel-gestion-auto-ecole" className="btn-violet inline-flex w-full justify-center">
                  Inscrire mon auto-école
                </Link>
                <p className="mt-2.5 text-center text-xs text-muted">
                  3 mois d&apos;essai gratuit, sans carte bancaire.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-3xl border border-token bg-surface-1 p-6 shadow-card">
              <div>
                <p className="font-display text-base font-bold text-foreground">
                  Option — Forfait Top 20
                </p>
                <p className="mt-1 text-sm text-secondary">
                  Mise en avant de votre auto-école dans le Top 20 affiché sur la page d&apos;accueil,
                  pendant 7 jours. Réservé aux auto-écoles déjà abonnées.
                </p>
              </div>
              {featuredPlan && (
                <p className="mt-4 font-display text-2xl font-black text-foreground">
                  {fmtXof(featuredPlan.priceXof)}
                  <span className="text-sm font-semibold text-muted"> / semaine</span>
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="mt-14">
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
      </main>

      <SiteFooter />
    </div>
  );
}
