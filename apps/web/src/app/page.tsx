import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { spaceFromHost, type Space } from '@/lib/space';
import HomeClient from './HomeClient';
import StudentHome from './learn/StudentHome';
import GestionClient from './mon-ecole/GestionClient';

async function currentSpace(): Promise<Space> {
  const h = await headers();
  return (h.get('x-permis-space') as Space) || spaceFromHost(h.get('host'));
}

export async function generateMetadata(): Promise<Metadata> {
  const space = await currentSpace();
  if (space === 'learn')
    return {
      title: 'Mon espace — réviser le code de la route',
      description:
        'Panneaux, cours, séries de quiz et examens blancs du code de la route sénégalais.',
      alternates: { canonical: '/' },
    };
  if (space === 'school')
    return {
      title: 'Espace auto-école — gérer mes élèves',
      description:
        'Pré-inscriptions, élèves, équipe, planning et paiements de votre auto-école, dans un seul tableau de bord.',
      alternates: { canonical: '/' },
    };
  return {
    title: 'PERMIS 2.0 — Réviser le code et trouver son auto-école au Sénégal',
    description:
      "Préparez le code de la route, passez des examens blancs, et trouvez l'auto-école idéale près de chez vous. Gratuit pour commencer.",
    alternates: { canonical: '/' },
  };
}

export default async function Page() {
  const space = await currentSpace();
  if (space === 'learn') return <StudentHome />;
  if (space === 'school') return <GestionClient />;
  return <HomeClient />;
}
