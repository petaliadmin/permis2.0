import type { Metadata } from 'next';
import Link from 'next/link';
import TrafficSignsClient from './TrafficSignsClient';
import { TrafficSignsFullIndex } from './TrafficSignsFullIndex';
import { buildMetadata } from '@/lib/seo/metadata';
import { organizationNode, websiteNode, graphScript, SITE_URL } from '@/lib/seo/jsonLd';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Lot 2.1 — migrated to the shared helper (canonical/OG/Twitter built from
// one input instead of hand-rolled). Lot 2.7: no "en français et en wolof"
// — no wolof content exists at hub/category level, only per-sign audio
// where a recording happens to exist (hooks/useWolofAudio.ts). Lot 1.2:
// server-rendered now (real data + a full crawlable index below the
// picker), so the Lot 0.4 noindex (near-empty HTML shell) no longer applies.
export const metadata: Metadata = buildMetadata({
  title: 'Panneaux de signalisation du Sénégal',
  description:
    'Apprenez tous les panneaux de signalisation routière du code sénégalais : danger, interdiction, obligation, indication — avec fiches détaillées et quiz.',
  path: '/traffic-signs',
});

const FAQS = [
  {
    question: 'Combien y a-t-il de panneaux au code de la route sénégalais ?',
    answer:
      "Le code sénégalais reprend la classification francophone commune : panneaux de danger (triangle, bordure rouge), d'interdiction et de priorité (cercle ou losange), d'obligation (cercle bleu), d'indication (rectangle) et de signalisation temporaire ou de balisage. Cette page réunit une fiche détaillée pour chacun.",
  },
  {
    question: 'Les panneaux tombent-ils à l’examen du permis au Sénégal ?',
    answer:
      "Oui — la reconnaissance des panneaux est l'un des points les plus testés à l'examen théorique (code de la route). Chaque fiche panneau de cette page renvoie vers des quiz d'entraînement sur le même panneau et sa catégorie.",
  },
];

function jsonLd(): string {
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Panneaux', item: `${SITE_URL}/traffic-signs` },
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

/** Real, server-rendered paragraph content above the interactive picker —
 *  the hub used to be little more than a search box + a collapsed link
 *  list, which Google explored and dropped from its index (Search Console
 *  audit, 2026-09: "explorée, actuellement non indexée"). */
function TrafficSignsIntro() {
  return (
    <div className="px-4 pt-4">
      <p className="text-sm leading-relaxed text-secondary">
        Au Sénégal comme dans le reste de l&apos;espace francophone, les panneaux de signalisation
        se reconnaissent d&apos;abord à leur forme et leur couleur avant même leur dessin : triangle à
        bordure rouge pour un <strong>danger</strong>, cercle à bordure rouge pour une{' '}
        <strong>interdiction</strong> ou une <strong>obligation</strong> (fond bleu), losange jaune
        pour une règle de <strong>priorité</strong>, rectangle pour une simple{' '}
        <strong>indication</strong>. Reconnaître cette forme avant de lire le panneau en détail
        permet de réagir plus vite en conduite réelle — sur la VDN, la Corniche, ou une piste
        rurale — et c&apos;est exactement ce que teste l&apos;examen théorique du permis.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-secondary">
        Chaque panneau ci-dessous a sa propre fiche : signification, contexte où le rencontrer,
        règle de conduite associée et panneaux à ne pas confondre. Recherchez un panneau par nom,
        ou parcourez-les par catégorie, puis entraînez-vous avec les{' '}
        <Link href="/quizz" className="font-semibold text-primary-600 hover:underline">
          quiz thématiques
        </Link>
        .
      </p>
    </div>
  );
}

interface ApiSign {
  code: string | null;
  name: string;
  category: string;
  description: string;
  advice: string[];
  icone?: string | null;
}

interface PanneauRaw {
  name: string;
  code: string;
  description: string;
  category: string;
  icon: string;
  advice?: string[];
}

// Reference content changes rarely — revalidate daily, same as the sign
// detail pages (app/traffic-signs/[slug]/page.tsx), rather than the fully
// static `force-static` the brief suggests: the root layout already reads
// `headers()` (for the www/learn/school/admin space), which makes the whole
// render tree request-dependent — ISR is the pattern already proven to work
// under that constraint elsewhere in this app.
async function fetchSigns(): Promise<PanneauRaw[]> {
  try {
    const res = await fetch(`${API_URL}/traffic-signs?take=300`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const { data } = (await res.json()) as { data: ApiSign[] };
    return data
      .filter((s) => s.code)
      .map((s) => ({
        code: s.code as string,
        name: s.name,
        category: s.category,
        description: s.description,
        icon: s.icone ?? '',
        advice: s.advice,
      }));
  } catch {
    return [];
  }
}

function TrafficSignsFaq() {
  return (
    <section className="px-4 pb-8" aria-label="Questions fréquentes">
      <h2 className="mb-3 font-display text-base font-bold text-foreground">
        Questions fréquentes
      </h2>
      <div className="space-y-3">
        {FAQS.map((f) => (
          <div key={f.question}>
            <h3 className="font-display text-sm font-bold text-foreground">{f.question}</h3>
            <p className="mt-1 text-sm leading-relaxed text-secondary">{f.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function Page() {
  const signs = await fetchSigns();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd() }} />
      <TrafficSignsClient
        initialSigns={signs}
        intro={<TrafficSignsIntro />}
        fullIndex={
          <>
            <TrafficSignsFullIndex signs={signs} />
            <TrafficSignsFaq />
          </>
        }
      />
    </>
  );
}
