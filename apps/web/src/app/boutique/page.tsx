import type { Metadata } from 'next';
import BoutiqueClient from './BoutiqueClient';

export const metadata: Metadata = {
  title: 'Abonnement Permis — accès illimité au code de la route',
  description:
    'Débloquez tout le contenu premium PERMIS 2.0 : séries de quiz, examens blancs et cours de conduite illimités pour préparer votre permis au Sénégal.',
  alternates: { canonical: '/boutique' },
};

export default function Page() {
  return <BoutiqueClient />;
}
