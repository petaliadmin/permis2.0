/** Contact support — tout passe par WhatsApp. */
export const WHATSAPP_DISPLAY = '76 905 58 52';
export const WHATSAPP_INTL = '221769055852';

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent(message)}`;
}

/** Same as whatsappLink(), but for an arbitrary phone (e.g. a school's own WhatsApp number). */
export function whatsappLinkTo(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
