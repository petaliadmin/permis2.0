import type { Metadata } from 'next';
import CoursClient from './CoursClient';

export const metadata: Metadata = {
  title: 'Cours de code de la route',
  description:
    'Toutes les leçons du code de la route sénégalais organisées par thème : priorités, vitesse, stationnement, sécurité routière et plus.',
  alternates: { canonical: '/cours' },
};

export default function Page() {
  return <CoursClient />;
}
