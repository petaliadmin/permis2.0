/**
 * Builds a unique, non-duplicated meta description for a sign fiche.
 * The API's `meaning` and `description` fields are frequently identical
 * verbatim — naively concatenating them (the previous template) produced
 * "Virage dangereux à droite. Virage dangereux à droite." Dedupes at the
 * sentence level instead, so partial overlaps between the two fields don't
 * repeat either (brief Lot 2.2).
 */

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const SUFFIX = ' Signification, conseils de conduite et quiz — code de la route sénégalais.';
const MAX_LENGTH = 160;

export function buildSignMetaDescription(sign: {
  name: string;
  meaning: string;
  description: string;
}): string {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const s of [...sentences(sign.meaning), ...sentences(sign.description)]) {
    const key = s.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(s);
    }
  }
  const body = unique.join(' ');

  const withSuffix = `Panneau ${sign.name} : ${body}${SUFFIX}`;
  if (withSuffix.length <= MAX_LENGTH) return withSuffix;

  const withoutSuffix = `Panneau ${sign.name} : ${body}`;
  if (withoutSuffix.length <= MAX_LENGTH) return withoutSuffix;

  return withoutSuffix.slice(0, MAX_LENGTH - 1).trimEnd() + '…';
}
