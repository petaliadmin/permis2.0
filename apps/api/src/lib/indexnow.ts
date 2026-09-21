/** IndexNow — pings Bing/Yandex (and any other participating engine) the
 *  moment real content becomes newly indexable, instead of waiting for the
 *  next crawl. Matters more here than in Western Europe: Bing/Yandex carry
 *  a meaningfully larger share of search traffic in Senegal (audit
 *  finding, Lot 1). Key must match the file served at
 *  apps/web/src/app/{key}.txt/route.ts exactly — the two apps don't share
 *  runtime config, so this is kept in sync by hand.
 *
 *  Fire-and-forget by design: a failed ping just means IndexNow finds the
 *  URL on its next crawl anyway, same as before this existed — never worth
 *  failing or slowing down the request that triggered it.
 */

const INDEXNOW_KEY = 'c70ecfd4776ef4fc86a1a1378fa15d3c';
const SITE_HOST = 'www.permis2.com';
const SITE_URL = `https://${SITE_HOST}`;

export function pingIndexNow(paths: string[]): void {
  if (paths.length === 0) return;
  const urlList = paths.map((p) => `${SITE_URL}${p}`);

  fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  }).catch(() => {
    // Best-effort — see file header.
  });
}
