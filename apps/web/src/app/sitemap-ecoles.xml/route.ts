import { serializeUrlset, SITEMAP_XML_HEADERS } from '@/lib/sitemapXml';

// Deliberately empty for now. Lot 3.5 of the brief wires this up to real
// city/school URLs — but only once Lot 3.2's guard exists (a city page must
// have ≥3 real schools to be generated at all) and once it's confirmed the
// *production* database actually has real school data: this app's local
// dev DB has 12 seeded schools, which made /ecoles and /auto-ecoles-senegal
// render correctly while testing Lot 1, but the brief's own audit measured
// production returning "0 auto-école" on the same page — that gap needs
// resolving with the site owner before any school/city URL goes in a
// sitemap that's supposed to only ever list real, stable content.
//
// Next.js 15 defaults Route Handlers to uncached — force-static here too.
export const dynamic = 'force-static';

export async function GET() {
  return new Response(serializeUrlset([]), { headers: SITEMAP_XML_HEADERS });
}
