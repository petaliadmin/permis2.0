import type { Metadata } from 'next';
import TestsClient from './TestsClient';

export const metadata: Metadata = {
  title: 'Test rapide code de la route',
  description:
    'Un test rapide de 20 questions aléatoires pour évaluer ton niveau au code de la route sénégalais en quelques minutes.',
  alternates: { canonical: '/tests' },
};

export default function Page() {
  return <TestsClient />;
}
