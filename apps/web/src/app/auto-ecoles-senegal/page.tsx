import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { slugify } from '@/lib/slug';
import { IconChevronRight } from '@tabler/icons-react';
import { buildMetadata } from '@/lib/seo/metadata';
import { organizationNode, websiteNode, graphScript, SITE_URL } from '@/lib/seo/jsonLd';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata: Metadata = buildMetadata({
  title: 'Auto-écoles au Sénégal — Comparer et choisir',
  // Lot 2.1 — was 184 chars (well over the 140-160 target).
  description:
    "Trouvez une auto-école au Sénégal : villes couvertes, services proposés, critères pour bien choisir, et pré-inscription en ligne gratuite dès aujourd'hui.",
  path: '/auto-ecoles-senegal',
});

interface DirectoryStats {
  cities: string[];
  services: string[];
}

async function fetchDirectoryStats(): Promise<DirectoryStats> {
  try {
    const res = await fetch(`${API_URL}/schools?take=50`, { next: { revalidate: 3600 } });
    if (!res.ok) return { cities: [], services: [] };
    const schools = (await res.json()) as { city?: string | null; services?: string[] }[];
    const cities = [...new Set(schools.map((s) => s.city).filter((c): c is string => !!c))].sort(
      (a, b) => a.localeCompare(b, 'fr')
    );
    const services = [...new Set(schools.flatMap((s) => s.services ?? []))];
    return { cities, services };
  } catch {
    return { cities: [], services: [] };
  }
}

const FAQS = [
  {
    question: 'Toutes les auto-écoles proposent-elles les mêmes services ?',
    answer:
      "Non — les services varient d'une auto-école à l'autre (code en salle ou en ligne, simulateur, permis accéléré, cours en wolof, poids lourd…). Comparez-les directement dans l'annuaire avant de choisir.",
  },
  {
    question: 'Puis-je me pré-inscrire en ligne auprès d’une auto-école ?',
    answer:
      "Oui. Sur la fiche de chaque auto-école partenaire, un formulaire de pré-inscription permet d'envoyer votre demande directement en ligne ; l'auto-école la valide ensuite.",
  },
  {
    question: 'Comment contacter une auto-école avant de s’inscrire ?',
    answer:
      "Chaque fiche auto-école affiche son téléphone, son WhatsApp et sa localisation, pour poser vos questions avant de vous engager.",
  },
  {
    question: 'Mon auto-école peut-elle rejoindre PERMIS2.0 ?',
    answer:
      "Oui. Créez un compte auto-école, complétez votre profil (ville, services, moniteurs) et vous apparaissez immédiatement dans l'annuaire et sur la carte.",
  },
];

function jsonLd(): string {
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Auto-écoles',
        item: `${SITE_URL}/auto-ecoles-senegal`,
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
  return graphScript([organizationNode(), websiteNode(), breadcrumb, faqPage]);
}

export default async function AutoEcolesSenegalPage() {
  const { cities, services } = await fetchDirectoryStats();

  return (
    <div className="on-light min-h-screen bg-surface">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd() }} />

      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-foreground">
            Accueil
          </Link>
          <IconChevronRight size="1em" className="text-[10px]" aria-hidden="true" />
          <span className="text-foreground">Auto-écoles</span>
        </nav>

        <span className="chip chip-primary">Sénégal</span>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Auto-écoles au Sénégal
        </h1>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-secondary sm:text-base">
          <p>
            PERMIS 2.0 référence des auto-écoles partenaires dans plusieurs villes du Sénégal,
            avec leurs services, leurs tarifs et les catégories de permis proposées. Comparez-les
            et pré-inscrivez-vous en ligne, gratuitement. Choisir la bonne auto-école a un effet
            direct sur la suite de votre formation : encadrement des moniteurs, disponibilité des
            véhicules et proximité géographique jouent tous sur le temps que vous mettrez à
            obtenir votre permis.
          </p>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              Comment choisir une auto-école au Sénégal ?
            </h2>
            <p className="mt-3">
              Avant de vous engager, comparez au moins ces critères :
            </p>
            <ul className="mt-4 list-disc space-y-1.5 pl-5">
              <li>
                Les{' '}
                <Link
                  href="/permis-conduire-senegal"
                  className="font-semibold text-primary-600 hover:underline"
                >
                  catégories de permis
                </Link>{' '}
                proposées (A, B, C, D, E) — toutes les auto-écoles ne préparent pas à toutes les
                catégories, en particulier pour les poids lourds (catégories C et D).
              </li>
              <li>
                Les services inclus : code en salle ou en ligne, simulateur de conduite, leçons de
                conduite, accompagnement pour le dossier administratif.
              </li>
              <li>
                La localisation par rapport à votre domicile ou votre lieu de travail — des leçons
                proches limitent le temps et le coût des déplacements sur toute la durée de la
                formation.
              </li>
              <li>
                Le tarif affiché, à comparer à budget et catégorie de permis égaux entre plusieurs
                auto-écoles plutôt qu'en valeur absolue.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground">
              Comment fonctionne la pré-inscription en ligne ?
            </h2>
            <p className="mt-3">
              Sur la fiche de chaque auto-école partenaire, un formulaire de pré-inscription vous
              permet d'envoyer directement vos coordonnées et la catégorie de permis visée, sans
              avoir à vous déplacer pour un premier contact. L'auto-école reçoit votre demande dans
              son propre tableau de bord et peut vous répondre par téléphone, WhatsApp ou email
              pour préciser tarifs, disponibilités et documents à fournir.
            </p>
            <p className="mt-3">
              Cette étape ne vous engage à rien : elle sert à obtenir des informations précises
              avant de valider votre inscription définitive directement auprès de l'auto-école.
              Une fois connecté, le suivi de vos demandes reste accessible depuis votre compte,
              dans l'espace « Mes auto-écoles ».
            </p>
          </section>

          {cities.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-foreground">Villes couvertes</h2>
              <p className="mt-3">
                Des auto-écoles partenaires sont référencées notamment à :
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {cities.map((city) => (
                  <Link
                    key={city}
                    href={`/auto-ecoles-senegal/${slugify(city)}`}
                    className="rounded-full border border-token bg-surface-1 px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-surface-2"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {services.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-foreground">
                Les services proposés par nos auto-écoles partenaires
              </h2>
              <p className="mt-3">
                Selon l'auto-école choisie, vous retrouverez par exemple :{' '}
                {services.join(', ').toLowerCase()}.
              </p>
            </section>
          )}

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
              Prêt à comparer les auto-écoles ?
            </p>
            <Link href="/ecoles" className="btn-primary shrink-0 !py-2.5 text-sm">
              Voir l'annuaire
            </Link>
          </div>

          <p className="text-center text-xs text-muted">
            Vous dirigez une auto-école ?{' '}
            <Link href="/auto-ecole" className="font-semibold text-primary-600 hover:underline">
              Rejoignez PERMIS2.0
            </Link>
            .
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
