export interface FaqItem {
  question: string;
  answer: string;
}

/** Shared between the visual FAQ accordion and the homepage's FAQPage JSON-LD. */
export const HOME_FAQS: FaqItem[] = [
  {
    question: 'PERMIS2.0 est-il gratuit pour les élèves ?',
    answer:
      "Oui, la création de compte, la recherche d'auto-écoles et la pré-inscription sont entièrement gratuites. Certains contenus premium (examens blancs, cours) sont proposés en option.",
  },
  {
    question: 'Comment fonctionne la pré-inscription en ligne ?',
    answer:
      "Vous choisissez une auto-école, remplissez un formulaire en quelques minutes et l'auto-école valide votre inscription. Vous êtes notifié dès que c'est confirmé.",
  },
  {
    question: 'Comment mon auto-école peut-elle rejoindre PERMIS2.0 ?',
    answer:
      "Créez un compte auto-école, complétez votre profil (ville, services, moniteurs) et vous apparaissez immédiatement dans l'annuaire et sur la carte.",
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      'Oui. Vos informations personnelles et vos paiements sont protégés et ne sont jamais partagés avec des tiers sans votre consentement.',
  },
  {
    question: 'PERMIS2.0 est-il disponible en dehors de Dakar ?',
    answer:
      'Oui, la plateforme couvre plus de 150 villes au Sénégal, dont Thiès, Saint-Louis, Kaolack et Ziguinchor.',
  },
];
