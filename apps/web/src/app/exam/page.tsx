import type { Metadata } from 'next';
import ExamClient from './ExamClient';

export const metadata: Metadata = {
  title: 'Examen blanc du permis de conduire',
  description:
    "Passe un examen blanc dans les conditions réelles de l'examen du permis de conduire au Sénégal et évalue ton niveau avant le jour J.",
  alternates: { canonical: '/exam' },
};

export default function Page() {
  return <ExamClient />;
}
