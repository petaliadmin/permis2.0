import type { Metadata } from 'next';
import PackEcoleClient from './PackEcoleClient';

export const metadata: Metadata = {
  title: 'Code auto-école — activer un accès élève',
  description:
    "Élève d'une auto-école au Sénégal : activez gratuitement votre accès premium au code de la route avec le code fourni par votre auto-école.",
  alternates: { canonical: '/pack-ecole' },
};

export default function Page() {
  return <PackEcoleClient />;
}
