import type { Metadata } from 'next';
import GestionClient from './GestionClient';

export const metadata: Metadata = {
  title: 'Gérer mon auto-école',
  description: 'Dashboard auto-école : demandes de pré-inscription, équipe, statistiques.',
  alternates: { canonical: '/mon-ecole' },
};

export default function Page() {
  return <GestionClient />;
}
