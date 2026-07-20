import { redirect } from 'next/navigation';

/**
 * L'accueil a été supprimé : l'app s'ouvre directement sur les Panneaux.
 * Tous les liens historiques vers « / » (post-login, PWA, retours) atterrissent ici.
 */
export default function Home() {
  redirect('/traffic-signs');
}
