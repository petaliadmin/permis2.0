import { redirect } from 'next/navigation';

/**
 * L'accueil a été supprimé : l'app s'ouvre directement sur les Cours.
 * Tous les liens historiques vers « / » (post-login, PWA, retours) atterrissent ici.
 */
export default function Home() {
  redirect('/cours');
}
