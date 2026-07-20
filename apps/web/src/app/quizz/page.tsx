import type { Metadata } from 'next';
import QuizzClient from './QuizzClient';

export const metadata: Metadata = {
  title: "Quiz code de la route — séries d'entraînement",
  description:
    "Entraîne-toi avec des séries de quiz thématiques sur le code de la route sénégalais, suis ta progression et révise tes points faibles.",
  alternates: { canonical: '/quizz' },
};

export default function Page() {
  return <QuizzClient />;
}
