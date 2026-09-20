import type { Metadata } from 'next';
import GestionClient from './GestionClient';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Gérer mon auto-école',
  description: 'Dashboard auto-école : demandes de pré-inscription, équipe, statistiques.',
  path: '/mon-ecole',
  robots: { index: false, follow: false },
});

export default function Page() {
  return <GestionClient />;
}
