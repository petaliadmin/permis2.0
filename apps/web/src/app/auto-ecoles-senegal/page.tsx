import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { slugify } from '@/lib/slug';

const SITE_URL = 'https://www.permis2.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata: Metadata = {
  title: 'Auto-écoles au Sénégal — Comparer et choisir',
  description:
    "Trouvez une auto-école au Sénégal : villes couvertes, services proposés (code en ligne, conduite, permis accéléré...), critères pour bien choisir, et pré-inscription en ligne gratuite.",
  alternates: { canonical: '/auto-ecoles-senegal' },
};

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

function jsonLd() {
  const breadcrumb = {
    '@context': 'https://schema.org',
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

export default async function AutoEcolesSenegalPage() {
  const { cities, services } = await fetchDirectoryStats();

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
            et pré-inscrivez-vous en ligne, gratuitement.
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
                proposées (A, B, C, D, E).
              </li>
              <li>Les services inclus (code en salle ou en ligne, simulateur, conduite…).</li>
              <li>La localisation, pour limiter les déplacements.</li>
              <li>Le tarif affiché, à budget égal entre plusieurs auto-écoles.</li>
            </ul>
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
                  <p className="font-display text-sm font-bold text-foreground">{f.question}</p>
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
