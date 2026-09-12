import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { slugify } from '@/lib/slug';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SITE_URL = 'https://www.permis2.com';

interface SignDetail {
  id: string;
  name: string;
  code: string | null;
  meaning: string;
  category: string;
  description: string;
  contexte_usage: string | null;
  regle_associee: string | null;
  advice: string[];
  relatedSigns: { id: string; name: string }[];
}

const CAT_LABEL: Record<string, string> = {
  danger: 'Panneau de danger',
  interdiction: "Panneau d'interdiction",
  obligation: "Panneau d'obligation",
  priorite: 'Panneau de priorité',
  indication: "Panneau d'indication",
  direction: 'Panneau de direction',
  temporaire: 'Signalisation temporaire',
  restriction: 'Restriction de dimensions',
  stationnement: 'Signalisation de stationnement',
};

// Reference content changes rarely — revalidate daily rather than on every request.
async function fetchSign(slug: string): Promise<SignDetail | null> {
  try {
    const res = await fetch(`${API_URL}/traffic-signs/by-slug/${slug}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sign = await fetchSign(slug);
  if (!sign) return { title: 'Panneau introuvable' };

  return {
    title: `Panneau ${sign.name} — Signification`,
    description: `${sign.meaning} ${sign.description}`.slice(0, 155),
    alternates: { canonical: `/traffic-signs/${slug}` },
  };
}

function breadcrumbJsonLd(sign: SignDetail, slug: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Panneaux', item: `${SITE_URL}/traffic-signs` },
      {
        '@type': 'ListItem',
        position: 3,
        name: sign.name,
        item: `${SITE_URL}/traffic-signs/${slug}`,
      },
    ],
  };
}

export default async function SignDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sign = await fetchSign(slug);
  if (!sign) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(sign, slug)) }}
      />
      <AppShell>
        <PageHeader
          title={sign.name}
          subtitle={CAT_LABEL[sign.category] ?? sign.category}
          accent="blue"
          back="/traffic-signs"
        />

        <div className="px-4 pb-10 pt-5">
          <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1.5 text-xs text-muted">
            <Link href="/" className="hover:text-foreground">
              Accueil
            </Link>
            <i className="ti ti-chevron-right text-[10px]" aria-hidden="true" />
            <Link href="/traffic-signs" className="hover:text-foreground">
              Panneaux
            </Link>
            <i className="ti ti-chevron-right text-[10px]" aria-hidden="true" />
            <span className="truncate text-foreground">{sign.name}</span>
          </nav>

          <div className="flex items-center gap-4 rounded-2xl border border-token bg-surface-1 p-4 shadow-soft">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-2 p-2">
              {sign.code ? (
                <Image
                  src={`/icons/panneaux/${sign.code}.svg`}
                  alt={sign.name}
                  width={72}
                  height={72}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              ) : (
                <i className="ti ti-road-sign text-3xl text-slate-400" aria-hidden="true" />
              )}
            </div>
            <div>
              {sign.code && (
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Code {sign.code}
                </p>
              )}
              <p className="mt-1 text-sm font-semibold text-secondary">
                {CAT_LABEL[sign.category] ?? sign.category}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-primary-50 p-4">
            <p className="text-sm font-bold text-primary-700">Que signifie ce panneau ?</p>
            <p className="mt-1 text-sm leading-relaxed text-primary-900">{sign.meaning}</p>
          </div>

          <div className="mt-5">
            <p className="mb-2 font-display text-sm font-bold text-foreground">Description</p>
            <p className="text-sm leading-relaxed text-secondary">{sign.description}</p>
          </div>

          {sign.contexte_usage && (
            <div className="mt-5">
              <p className="mb-2 font-display text-sm font-bold text-foreground">
                Où le rencontre-t-on ?
              </p>
              <p className="text-sm leading-relaxed text-secondary">{sign.contexte_usage}</p>
            </div>
          )}

          {sign.regle_associee && (
            <div className="mt-5 rounded-2xl bg-success-50 p-4">
              <p className="mb-1 font-display text-sm font-bold text-success-700">
                Règle à retenir
              </p>
              <p className="text-sm leading-relaxed text-success-700">{sign.regle_associee}</p>
            </div>
          )}

          {sign.advice.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 font-display text-sm font-bold text-foreground">Conseils</p>
              <ul className="space-y-1.5">
                {sign.advice.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-secondary">
                    <i className="ti ti-bulb mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sign.relatedSigns.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 font-display text-sm font-bold text-foreground">
                Panneaux similaires
              </p>
              <div className="flex flex-wrap gap-2">
                {sign.relatedSigns.map((r) => (
                  <Link
                    key={r.id}
                    href={`/traffic-signs/${slugify(r.name)}`}
                    className="rounded-full border border-token bg-surface-1 px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-surface-2"
                  >
                    {r.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link
            href="/quizz"
            className="btn-primary mt-8 flex w-full items-center justify-center gap-2 !py-3 text-sm"
          >
            S'entraîner sur les panneaux
            <i className="ti ti-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </AppShell>
    </>
  );
}
