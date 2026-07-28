import type { Metadata } from 'next';
import MesAutoEcolesClient from './MesAutoEcolesClient';

export const metadata: Metadata = {
  title: 'Mes auto-écoles',
  description: 'Vos inscriptions et demandes de pré-inscription auprès des auto-écoles partenaires.',
  alternates: { canonical: '/mes-auto-ecoles' },
};

export default function Page() {
  return <MesAutoEcolesClient />;
}
