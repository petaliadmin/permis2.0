// IndexNow key verification file (Étape 1/7 — audit: "aucune implémentation
// IndexNow... pertinent sur un marché où [Bing/Yandex] comptent davantage
// qu'en Europe de l'Ouest"). Must be served at the site root as
// `{key}.txt` returning exactly the key — this file's name IS the key, per
// the IndexNow protocol. Pinged from apps/api (see lib/indexnow.ts) whenever
// real content becomes newly indexable; kept in sync with that key by hand
// since the two apps don't share runtime config.
export const dynamic = 'force-static';

const KEY = 'c70ecfd4776ef4fc86a1a1378fa15d3c';

export async function GET() {
  return new Response(KEY, { headers: { 'Content-Type': 'text/plain' } });
}
