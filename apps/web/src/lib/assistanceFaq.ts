import { SUBSCRIPTION_PRICE_PERIOD } from '@permis2.0/shared';
import { WHATSAPP_DISPLAY } from '@/lib/contact';

export interface FaqItem {
  question: string;
  answer: string;
}

/** Shared between the visual FAQ accordion and the /assistance FAQPage JSON-LD. */
export const ASSISTANCE_FAQS: FaqItem[] = [
  {
    question: "Comment fonctionne l'abonnement ?",
    answer: `L'abonnement à ${SUBSCRIPTION_PRICE_PERIOD} débloque tous les quiz, les séries d'examen et le mode examen officiel. Contactez-nous sur WhatsApp au ${WHATSAPP_DISPLAY} pour l'activer — c'est immédiat.`,
  },
  {
    question: 'Le contenu est-il conforme au Code sénégalais ?',
    answer:
      'Oui. Les panneaux, priorités, vitesses et infractions suivent le Code de la route du Sénégal. Toute information non vérifiable est signalée.',
  },
  {
    question: 'Puis-je réviser sans connexion ?',
    answer:
      "Oui, l'app est une PWA : les leçons consultées sont mises en cache pour une révision hors-ligne.",
  },
  {
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer: `Wave et Orange Money, directement auprès de notre équipe : écrivez-nous sur WhatsApp au ${WHATSAPP_DISPLAY} et votre abonnement est activé immédiatement après le paiement.`,
  },
];
