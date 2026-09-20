import type { Metadata } from 'next';
import MesAutoEcolesClient from './MesAutoEcolesClient';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Mes auto-écoles',
  description: 'Vos inscriptions et demandes de pré-inscription auprès des auto-écoles partenaires.',
  path: '/mes-auto-ecoles',
  robots: { index: false, follow: false },
});

export default function Page() {
  return <MesAutoEcolesClient />;
}
