/**
 * Shared JSON-LD infrastructure (brief Lot 2.4). Every page that needs
 * structured data renders exactly one `<script type="application/ld+json">`
 * via `graphScript()`, as a single `@graph` array — never several separate
 * `<script>` tags. Organization and WebSite are built once here
 * (organizationNode/websiteNode) and given a stable `@id` so other nodes on
 * the same page reference them (`{ '@id': ORGANIZATION_ID }`) instead of
 * re-embedding the full object.
 */

export const SITE_URL = 'https://www.permis2.com';
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationNode() {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'PERMIS2.0',
    url: SITE_URL,
    // Lot 0.3 — apple-touch-icon.png is opaque and ≥112px (passes Google's
    // checks) but square, not the landscape mark Google's guidelines prefer.
    // No such asset exists in the repo; needs design input.
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/apple-touch-icon.png`, width: 180, height: 180 },
    areaServed: { '@type': 'Country', name: 'Sénégal' },
    // Audit finding — no contactPoint existed anywhere in the graph. WhatsApp
    // (lib/contact.ts WHATSAPP_DISPLAY/WHATSAPP_INTL) and contact@permis2.com
    // are the site's real, live support channels, used throughout
    // /assistance, /contact, /mentions-legales.
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: '+221-76-905-58-52',
      email: 'contact@permis2.com',
      areaServed: 'SN',
      availableLanguage: ['French'],
    },
    sameAs: ['https://www.facebook.com/permis2sn'],
  };
}

export function websiteNode(description?: string) {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'PERMIS2.0',
    url: SITE_URL,
    ...(description ? { description } : {}),
    inLanguage: 'fr-SN',
    publisher: { '@id': ORGANIZATION_ID },
    // Lot 2.5 — SearchAction for sitelinks searchbox eligibility. /ecoles is
    // the only real search on the site (auto-école directory); {search_term_string}
    // isn't wired to it yet (its filters are client-side state, not a URL
    // query param), so this documents intent without claiming a query
    // interface that doesn't exist — omitted rather than pointing at a
    // param the page doesn't read. Revisit once /ecoles reads ?q= from the URL.
  };
}

// Pages that build their own complete graph (organizationNode()/
// websiteNode() + their own breadcrumb/article/FAQ/etc nodes) and therefore
// must NOT also get the root layout's separate base script — see
// middleware.ts (x-pathname header) and app/layout.tsx.
const OWN_GRAPH_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/blog\/[^/]+$/,
  /^\/traffic-signs\/categorie\/[^/]+$/,
  /^\/traffic-signs\/(?!categorie$)[^/]+$/,
  /^\/assistance$/,
  /^\/auto-ecoles-senegal$/,
  /^\/auto-ecoles-senegal\/[^/]+$/,
  /^\/auto-ecoles-senegal\/[^/]+\/permis-[a-e]$/,
  /^\/code-route-senegal$/,
  /^\/ecoles$/,
  /^\/logiciel-gestion-auto-ecole$/,
  /^\/ecoles\/[^/]+$/,
  /^\/permis-conduire-senegal$/,
  /^\/tarifs$/,
  /^\/traffic-signs$/,
];

export function pageProvidesOwnGraph(pathname: string): boolean {
  return OWN_GRAPH_PATTERNS.some((re) => re.test(pathname));
}

/** Escapes `<` so a field sourced from partner-controlled data (a school
 *  name, a review) can never break out of the <script> tag. */
function escapeForScript(json: string): string {
  return json.replace(/</g, '\\u003c');
}

/** Serializes `nodes` as one `@graph`, ready for `dangerouslySetInnerHTML`. */
export function graphScript(nodes: object[]): string {
  return escapeForScript(JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }));
}
