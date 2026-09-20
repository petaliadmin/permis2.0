import Link from 'next/link';
import { categoryMeta, groupAllByCategory, type MinimalSign } from '@/lib/trafficSignCategories';
import { slugify } from '@/lib/slug';

/**
 * Full, real link to every sign fiche — server-rendered, collapsed by
 * default via native <details>/<summary> (not CSS display:none, which
 * search engines can treat as deceptively hidden content; a native
 * disclosure widget isn't — Google explicitly doesn't penalize collapsed/
 * accordion content). Sits below the interactive picker (TrafficSignsClient)
 * without changing it: this is what gets /traffic-signs from "0 panneaux
 * before hydration, 2 links in raw HTML" to a real, crawlable index (SEO
 * brief Lot 1.2).
 */
export function TrafficSignsFullIndex({ signs }: { signs: MinimalSign[] }) {
  const groups = groupAllByCategory(signs);
  if (signs.length === 0) return null;

  return (
    <section className="mt-8 px-4 pb-6" aria-label="Index complet des panneaux">
      <h2 className="mb-3 font-display text-base font-bold text-foreground">
        Tous les panneaux ({signs.length})
      </h2>
      <div className="space-y-2">
        {groups.map(({ category, signs: catSigns }) => {
          const m = categoryMeta(category);
          return (
            <details
              key={category}
              className="rounded-2xl border border-token bg-surface-1 p-3 open:pb-4"
            >
              <summary className="cursor-pointer list-none font-display text-sm font-bold text-foreground">
                {m.label} ({catSigns.length})
              </summary>
              <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3">
                {catSigns.map((sign) => (
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
            </details>
          );
        })}
      </div>
    </section>
  );
}
