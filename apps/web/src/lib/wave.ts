/**
 * Static Wave merchant checkout — no payment processor. Everyone pays the same
 * merchant link (QR or tap), then the team activates the subscription from
 * /admin/demandes once the transfer lands in the Wave dashboard.
 *
 * Override the merchant base with NEXT_PUBLIC_WAVE_PAY_URL.
 */
export const WAVE_PAY_BASE =
  process.env.NEXT_PUBLIC_WAVE_PAY_URL || 'https://pay.wave.com/m/M_sn_3-tNRQQYLmR6/c/sn/';

/** Wave checkout link with the amount pre-filled. */
export function waveLink(amountXof: number): string {
  if (/[?&]amount=/.test(WAVE_PAY_BASE)) return WAVE_PAY_BASE;
  const sep = WAVE_PAY_BASE.includes('?') ? '&' : '?';
  return `${WAVE_PAY_BASE}${sep}amount=${amountXof}`;
}
