import type { Metadata } from 'next';
import AutoEcoleClient from './AutoEcoleClient';

export const metadata: Metadata = {
  title: 'Espace Auto-École — packs premium pour vos élèves',
  description:
    "Vous dirigez une auto-école au Sénégal ? Achetez des packs premium PERMIS 2.0 pour vos élèves, distribuez des codes d'accès et suivez leur activation depuis un tableau de bord dédié.",
  alternates: { canonical: '/auto-ecole' },
};

export default function Page() {
  return <AutoEcoleClient />;
}
