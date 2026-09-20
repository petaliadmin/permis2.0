import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { slugify } from '@/lib/slug';
import { CATEGORY_ORDER, categoryMeta } from '@/lib/trafficSignCategories';
import { IconChevronRight } from '@tabler/icons-react';
import { organizationNode, websiteNode, graphScript, SITE_URL } from '@/lib/seo/jsonLd';
import { buildMetadata } from '@/lib/seo/metadata';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// URL slug (accent-free) → the category key as stored in the DB. Built from
// CATEGORY_ORDER + slugify so it can't drift from the picker/hub's own
// category list (danger, priorité→priorite, interdiction, obligation,
// indication).
const CATEGORY_BY_SLUG: Record<string, string> = Object.fromEntries(
  CATEGORY_ORDER.map((cat) => [slugify(cat), cat])
);

// ~150-word, category-specific intro (brief Lot 1.3). General, accurate
// road-code knowledge — no invented statistics, ratings or figures (brief
// rule 1).
const INTROS: Record<string, string> = {
  danger:
    "Les panneaux de danger — triangulaires, fond blanc, bordure rouge — signalent un risque à venir sur la route : virage, descente, chaussée glissante, passage d'animaux, chantier, chute de pierres. Ils appellent une vigilance accrue et souvent un ralentissement anticipé, sans imposer de manœuvre précise contrairement aux panneaux d'obligation : c'est au conducteur d'adapter lui-même sa conduite à la situation annoncée. Au Sénégal, on les rencontre fréquemment aux abords des zones urbaines mal éclairées, sur les pistes en latérite dégradées par la saison des pluies, près des passages d'animaux domestiques ou sauvages en zone rurale, et sur les tronçons en travaux où la signalisation temporaire se superpose parfois à la signalisation permanente. Une erreur fréquente à l'examen consiste à confondre le panneau de danger générique (point d'exclamation) avec un panneau d'obligation, ou à sous-estimer la distance nécessaire pour ralentir en toute sécurité, surtout de nuit sur une route non éclairée ou par temps de poussière réduisant la visibilité. Ignorer un panneau de danger n'entraîne pas d'amende directe — ce n'est pas une interdiction — mais l'accident qui en résulte engage la responsabilité du conducteur qui n'a pas adapté sa conduite au risque annoncé, un point souvent rappelé lors des cours de code.",
  priorité:
    "Les panneaux de priorité — cédez le passage, stop, route prioritaire, fin de route prioritaire, intersection avec route non prioritaire, passage étroit avec priorité — organisent qui passe en premier à un carrefour, un giratoire ou un croisement de pistes sans feux tricolores. Le triangle inversé « Cédez le passage » impose de ralentir et de céder si un véhicule arrive sur la voie prioritaire, sans obliger à un arrêt complet si la voie est libre ; l'octogone rouge « Stop », lui, impose un arrêt complet, roues immobiles, même en l'absence apparente de circulation, avant de redémarrer une fois la voie vérifiée dégagée. Au Sénégal, ces panneaux sont particulièrement déterminants aux intersections non aménagées des villes secondaires et aux abords des marchés, où circulation piétonne, charrettes et deux-roues se mêlent aux véhicules, souvent sans feux ni agent pour réguler le passage aux heures de forte affluence. Une confusion fréquente à l'examen : céder le passage n'oblige pas systématiquement à s'arrêter, contrairement au Stop qui impose l'arrêt dans tous les cas, y compris quand la route semble dégagée à vue d'œil. Le panneau « Route prioritaire », losange jaune bordé de blanc, indique à l'inverse que c'est vous qui avez la priorité sur les routes secondaires qui la croisent — jusqu'à ce qu'un panneau de fin de priorité l'annule. Le non-respect d'un panneau de priorité, notamment le Stop, reste l'une des infractions les plus sanctionnées lors des contrôles routiers, tant elle est directement liée aux accidents aux intersections — la première cause d'accident corporel en milieu urbain.",
  interdiction:
    "Ronds, fond blanc, cerclage rouge, les panneaux d'interdiction retirent un droit précis : sens interdit, interdiction de dépasser, de stationner, de tourner, de faire demi-tour, ou limitation de vitesse. Contrairement au panneau de danger, l'interdiction s'applique immédiatement dès son franchissement et sa violation constitue une infraction sanctionnable, qu'un accident survienne ou non — l'intention derrière le panneau ne compte pas, seul le respect de la règle affichée compte. Au Sénégal, les interdictions de stationner et de dépasser comptent parmi les plus fréquemment enfreintes en zone urbaine dense (Dakar, Thiès, Kaolack), faute parfois de signalisation toujours visible ou de zones de stationnement alternatives suffisantes pour les commerçants et les livraisons. Une confusion classique à l'examen consiste à confondre la fin d'une interdiction, marquée par une barre oblique sur fond gris, avec un panneau d'obligation qui a une fonction inverse, ou à mal évaluer la portée exacte d'une interdiction : certaines s'appliquent à toute la chaussée, d'autres à une seule voie ou à une catégorie de véhicules seulement. Le stationnement gênant ou le non-respect d'un sens interdit expose à une amende et, dans certains cas, à l'immobilisation du véhicule par les forces de l'ordre.",
  obligation:
    "Ronds, fond bleu, pictogramme blanc, les panneaux d'obligation imposent une action précise : direction obligatoire, piste cyclable obligatoire, vitesse minimale, contournement par la droite ou la gauche, chaîne à neige ou équipement spécial selon les pays. Ils se distinguent des panneaux d'interdiction par leur fond bleu — au lieu du cerclage rouge sur fond blanc — et par le fait qu'ils imposent une conduite à tenir plutôt qu'ils n'interdisent une action : l'un dit « fais ceci », l'autre dit « ne fais pas cela ». Au Sénégal, les panneaux de direction obligatoire sont très présents aux ronds-points et carrefours giratoires, de plus en plus nombreux dans les grandes villes pour fluidifier une circulation dense aux heures de pointe. Une erreur fréquente à l'examen consiste à confondre un panneau d'obligation de direction, flèche blanche sur fond bleu, avec un simple panneau indicateur de direction sans valeur obligatoire : le premier impose la manœuvre à l'intersection suivante, le second informe seulement sur la route à suivre pour une destination. Ne pas respecter un panneau d'obligation, en particulier à un giratoire où le sens de circulation est imposé, est une source fréquente de réserves lors de l'examen pratique de conduite.",
  indication:
    "Les panneaux d'indication — carrés ou rectangulaires, fond bleu le plus souvent — informent sans imposer ni interdire : parking, passage piéton, hôpital, station-service, arrêt de bus, autoroute, zone urbaine. C'est la catégorie la plus fournie du code sénégalais, avec une cinquantaine de panneaux, car elle couvre tous les services et aménagements utiles au conducteur et au piéton, bien au-delà des seules règles de circulation. Au Sénégal, on y trouve aussi bien des panneaux universels reconnus partout (parking, aéroport, hôpital) que des panneaux plus spécifiques aux réalités locales, comme les zones de passage de bétail en milieu rural ou les indications de bacs et traversées fluviales dans certaines régions du pays. Une confusion fréquente à l'examen consiste à attribuer une valeur obligatoire ou interdictive à un simple panneau d'indication, alors qu'il ne fait qu'informer — un panneau « parking » n'oblige pas à s'y stationner, il signale seulement sa présence à proximité. Bien identifier cette catégorie évite aussi de la confondre avec les panneaux de direction proprement dits, souvent verts sur les grands axes, qui forment une sous-famille dédiée au guidage vers les localités plutôt qu'à l'indication de services.",
};

// "Panneaux de danger" vs "Panneaux d'interdiction" — elides "de" before a
// vowel sound. Interdiction/Obligation/Indication all start with a vowel;
// Danger/Priorité don't — a plain `de ${label}` template got this wrong.
function categoryHeading(label: string): string {
  const lower = label.toLowerCase();
  return /^[aeiouéèêàâîïôû]/.test(lower) ? `Panneaux d'${lower}` : `Panneaux de ${lower}`;
}

interface ApiSign {
  name: string;
  code: string | null;
  category: string;
  description: string;
}

async function fetchCategorySigns(dbCategory: string): Promise<ApiSign[]> {
  try {
    const res = await fetch(
      `${API_URL}/traffic-signs/category/${encodeURIComponent(dbCategory)}?take=100`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const { data } = (await res.json()) as { data: ApiSign[] };
    return data;
  } catch {
    return [];
  }
}

export function generateStaticParams() {
  return CATEGORY_ORDER.map((cat) => ({ slug: slugify(cat) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dbCategory = CATEGORY_BY_SLUG[slug];
  if (!dbCategory) return { title: 'Catégorie introuvable' };
  const label = categoryMeta(dbCategory).label;

  return buildMetadata({
    title: `${categoryHeading(label)} — Code de la route Sénégal`,
    description: `${categoryHeading(label)} du code de la route sénégalais : signification, contexte d'usage et erreurs fréquentes à l'examen.`,
    path: `/traffic-signs/categorie/${slug}`,
  });
}

// Lot 2.4 — one @graph (WebSite + Organization + BreadcrumbList + ItemList)
// instead of two separate blocks; this page is in pageProvidesOwnGraph()
// (lib/seo/jsonLd.ts) so the root layout skips its own script here.
function categoryJsonLd(dbCategory: string, slug: string, label: string, signs: ApiSign[]): string {
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Panneaux', item: `${SITE_URL}/traffic-signs` },
      {
        '@type': 'ListItem',
        position: 3,
        name: label,
        item: `${SITE_URL}/traffic-signs/categorie/${slug}`,
      },
    ],
  };
  const itemList = {
    '@type': 'ItemList',
    name: categoryHeading(label),
    numberOfItems: signs.length,
    itemListElement: signs.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.name,
      url: `${SITE_URL}/traffic-signs/${slugify(s.name)}`,
    })),
  };
  return graphScript([organizationNode(), websiteNode(), breadcrumb, itemList]);
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbCategory = CATEGORY_BY_SLUG[slug];
  if (!dbCategory) notFound();

  const [signs, meta] = await Promise.all([
    fetchCategorySigns(dbCategory),
    Promise.resolve(categoryMeta(dbCategory)),
  ]);
  const siblings = CATEGORY_ORDER.filter((c) => c !== dbCategory);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: categoryJsonLd(dbCategory, slug, meta.label, signs) }}
      />
      <AppShell>
        <PageHeader
          title={categoryHeading(meta.label)}
          subtitle={`${signs.length} panneau${signs.length > 1 ? 'x' : ''}`}
          accent="blue"
          back="/traffic-signs"
        />

        <div className="px-4 pb-10 pt-5">
          <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1.5 text-xs text-muted">
            <Link href="/" className="hover:text-foreground">
              Accueil
            </Link>
            <IconChevronRight size="1em" className="text-[10px]" aria-hidden="true" />
            <Link href="/traffic-signs" className="hover:text-foreground">
              Panneaux
            </Link>
            <IconChevronRight size="1em" className="text-[10px]" aria-hidden="true" />
            <span className="truncate text-foreground">{meta.label}</span>
          </nav>

          {/* PageHeader above already renders the page's one <h1> (its
              `title` prop) — no second h1 here, just the intro copy. */}
          <p className="mt-3 text-sm leading-relaxed text-secondary">{INTROS[dbCategory]}</p>

          <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
            {signs.map((sign) => (
              <li key={sign.name}>
                <Link
                  href={`/traffic-signs/${slugify(sign.name)}`}
                  className="text-sm text-secondary hover:text-primary-600 hover:underline"
                >
                  {sign.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Autres catégories
            </p>
            <div className="flex flex-wrap gap-2">
              {siblings.map((cat) => (
                <Link
                  key={cat}
                  href={`/traffic-signs/categorie/${slugify(cat)}`}
                  className="rounded-full border border-token bg-surface-1 px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-surface-2"
                >
                  {categoryMeta(cat).label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    </>
  );
}
