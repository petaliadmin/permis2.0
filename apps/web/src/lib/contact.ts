/** Contact support — WhatsApp pour les réponses rapides, email pour le reste (demandes formelles, droits RGPD-like, mentions légales). */
export const WHATSAPP_DISPLAY = '76 905 58 52';
export const WHATSAPP_INTL = '221769055852';
export const CONTACT_EMAIL = 'contact@permis2.com';

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent(message)}`;
}

/**
 * Same as whatsappLink(), but for an arbitrary phone (e.g. a school's own
 * WhatsApp number, or a student's/instructor's). Numbers throughout the app
 * (User.phone, guestPhone, School.whatsapp) are stored in local 9-digit
 * format without the country code, so wa.me needs it prefixed back on —
 * Senegal-only app, so 221 is unambiguous.
 */
export function whatsappLinkTo(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  const intl = digits.startsWith('221') ? digits : `221${digits}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}
