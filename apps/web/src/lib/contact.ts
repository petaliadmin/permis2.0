/** Contact support — tout passe par WhatsApp. */
export const WHATSAPP_DISPLAY = '76 905 58 52';
export const WHATSAPP_INTL = '221769055852';

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_INTL}?text=${encodeURIComponent(message)}`;
}
