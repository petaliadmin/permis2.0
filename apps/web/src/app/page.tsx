import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'PERMIS 2.0 — Réviser le code et trouver son auto-école au Sénégal',
  description:
    "Préparez le code de la route, passez des examens blancs, et trouvez l'auto-école idéale près de chez vous. Gratuit pour commencer.",
  alternates: { canonical: '/' },
};

export default function Page() {
  return <HomeClient />;
}
