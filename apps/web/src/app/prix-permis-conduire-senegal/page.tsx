import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { buildMetadata } from '@/lib/seo/metadata';
import { organizationNode, websiteNode, graphScript, SITE_URL } from '@/lib/seo/jsonLd';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PermitPrice {
  id: string;
  city: string;
  category: string;
  priceXof: number;
  note: string | null;
  updatedAt: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  A: 'A — Motos et scooters',
  B: 'B — Véhicules légers',
  C: 'C — Poids lourds',
  D: 'D — Transport en commun',
  E: 'E — Remorques et attelages',
};

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

// Same cadence as the sitemap segments (Lot 1.6) — this data changes when an
// admin edits it, not on every request.
async function fetchPrices(): Promise<PermitPrice[]> {
  try {
    const res = await fetch(`${API_URL}/permit-prices`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const FAQS = [
  {
    question: 'Le prix du permis est-il le même partout au Sénégal ?',
    answer:
      "Non. Le tarif d'une auto-école dépend de sa ville, de ses charges locales et des services inclus (nombre de leçons de conduite, code en salle ou en ligne, simulateur). Comparez toujours plusieurs auto-écoles dans la même ville avant de choisir.",
  },
  {
    question: 'Quelles catégories de permis existent au Sénégal ?',
    answer:
      "Les catégories A (motos et scooters), B (véhicules légers), C (poids lourds), D (transport en commun) et E (remorques et attelages). Chaque catégorie a ses propres conditions d'âge, son propre programme de formation et donc son propre tarif.",
  },
  {
    question: 'Qu\'est-ce qui est généralement inclus dans le prix affiché par une auto-école ?',
    answer:
      "Cela varie d'une auto-école à l'autre : certaines affichent un forfait tout compris (dossier administratif, code, leçons de conduite, présentation à l'examen), d'autres facturent le code et la conduite séparément. Demandez toujours le détail avant de vous engager.",
  },
  {
    question: 'Comment savoir si un tarif est correct ?',
    answer:
      "Comparez plusieurs auto-écoles de la même ville, pour la même catégorie de permis, en demandant à chaque fois ce qui est inclus. Un tarif plus bas qui exclut certaines leçons ou l'inscription à l'examen n'est pas forcément le plus avantageux au final.",
  },
];

function jsonLd(prices: PermitPrice[]) {
  const faqPage = {
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Prix du permis au Sénégal',
        item: `${SITE_URL}/prix-permis-conduire-senegal`,
      },
    ],
  };
  const nodes: object[] = [organizationNode(), websiteNode(), breadcrumb, faqPage];
  // Real prices only — never fabricated (brief rule 1). No Offer nodes at
  // all while the admin-editable table (see admin/prix) is still empty.
  if (prices.length > 0) {
    nodes.push({
      '@type': 'ItemList',
      name: 'Tarifs du permis de conduire par ville et catégorie',
      itemListElement: prices.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Offer',
          name: `Permis ${p.category} — ${p.city}`,
          priceCurrency: 'XOF',
          price: p.priceXof,
          areaServed: p.city,
        },
      })),
    });
  }
  return graphScript(nodes);
}

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Prix du permis de conduire au Sénégal',
    description:
      'Comparez les tarifs du permis de conduire par ville et par catégorie au Sénégal : ce qui influence le prix, ce qui est inclus, et comment bien comparer les auto-écoles.',
    path: '/prix-permis-conduire-senegal',
  });
}

export default async function PrixPermisPage() {
  const prices = await fetchPrices();
  const cities = [...new Set(prices.map((p) => p.city))].sort((a, b) => a.localeCompare(b, 'fr'));
  const lastUpdated = prices.length
    ? new Date(Math.max(...prices.map((p) => new Date(p.updatedAt).getTime())))
    : null;

  return (
    <div className="on-light min-h-screen bg-surface">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(prices) }} />

      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-foreground">
            Accueil
          </Link>
          <span aria-hidden="true">›</span>
          <span className="text-foreground">Prix du permis</span>
        </nav>

        <span className="chip chip-primary">Sénégal</span>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Prix du permis de conduire au Sénégal
        </h1>
        {lastUpdated && (
          <p className="mt-2 text-xs text-muted">
            Dernière mise à jour des tarifs : {lastUpdated.toLocaleDateString('fr-FR')}
          </p>
        )}

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-secondary sm:text-base">
          <p>
            Le prix du permis de conduire au Sénégal varie fortement d'une auto-école à l'autre,
            d'une ville à l'autre, et d'une catégorie de permis à l'autre. Il n'existe pas de tarif
            national unique : chaque auto-école fixe son propre prix en fonction de ses charges
            (loyer, véhicules, moniteurs), des services inclus, et de la catégorie de permis
            préparée. Ce guide explique ce qui influence ce prix et comment comparer efficacement
            les auto-écoles avant de vous engager.
          </p>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              Tarifs par ville et par catégorie
            </h2>
            {prices.length === 0 ? (
              <p className="mt-3">
                Aucun tarif de référence n'est encore publié pour le moment. Consultez en
                attendant les fiches de nos{' '}
                <Link
                  href="/auto-ecoles-senegal"
                  className="font-semibold text-primary-600 hover:underline"
                >
                  auto-écoles partenaires
                </Link>
                , qui affichent chacune leur propre tarif.
              </p>
            ) : (
              <div className="mt-4 space-y-6">
                {cities.map((city) => (
                  <div key={city}>
                    <h3 className="font-display text-sm font-bold text-foreground">{city}</h3>
                    <div className="mt-2 overflow-hidden rounded-2xl border border-token">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-surface-1 text-xs font-semibold uppercase tracking-wide text-muted">
                          <tr>
                            <th className="px-4 py-2.5">Catégorie</th>
                            <th className="px-4 py-2.5">Prix</th>
                            <th className="px-4 py-2.5">Détail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-token bg-surface-1/40">
                          {prices
                            .filter((p) => p.city === city)
                            .map((p) => (
                              <tr key={p.id}>
                                <td className="px-4 py-2.5 font-semibold text-foreground">
                                  {CATEGORY_LABEL[p.category] ?? p.category}
                                </td>
                                <td className="px-4 py-2.5 font-semibold text-foreground">
                                  {fmtXof(p.priceXof)}
                                </td>
                                <td className="px-4 py-2.5 text-secondary">{p.note ?? '—'}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              Ce qui influence le prix du permis
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">La catégorie de permis.</strong> Le permis B
                (véhicules légers) est la catégorie la plus courante ; les catégories poids lourds
                (C) et transport en commun (D) demandent davantage d'heures de formation et
                coûtent généralement plus cher.
              </li>
              <li>
                <strong className="text-foreground">La ville.</strong> Les charges d'une
                auto-école (loyer, carburant, entretien des véhicules) varient selon la ville, ce
                qui se répercute sur le tarif final.
              </li>
              <li>
                <strong className="text-foreground">Les services inclus.</strong> Un forfait peut
                couvrir uniquement le code, ou le code et un nombre fixe de leçons de conduite, ou
                un accompagnement complet jusqu'à l'examen. Deux tarifs affichés à des niveaux
                différents ne sont comparables que si le contenu l'est aussi.
              </li>
              <li>
                <strong className="text-foreground">Le nombre de leçons de conduite
                nécessaires.</strong> Il dépend du niveau de chaque élève : certaines auto-écoles
                facturent les heures supplémentaires au-delà d'un forfait de base.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              Comment bien comparer les auto-écoles
            </h2>
            <p className="mt-3">
              Avant de choisir une auto-école sur la seule base du prix affiché, demandez le
              détail exact de ce qui est inclus : nombre de séances de code, nombre d'heures de
              conduite, frais de dossier et d'inscription à l'examen, et ce qui est facturé en
              supplément en cas d'heures additionnelles. Utilisez notre{' '}
              <Link href="/ecoles" className="font-semibold text-primary-600 hover:underline">
                annuaire des auto-écoles
              </Link>{' '}
              pour comparer plusieurs établissements de la même ville, consulter leurs services et
              leurs catégories de permis proposées, puis envoyer une pré-inscription en ligne
              gratuitement pour obtenir un devis précis.
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
              Comparez les auto-écoles et pré-inscrivez-vous gratuitement
            </p>
            <Link href="/ecoles" className="btn-primary shrink-0 !py-2.5 text-sm">
              Voir l'annuaire
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
