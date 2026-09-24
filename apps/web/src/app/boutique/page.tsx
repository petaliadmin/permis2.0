import { redirect } from 'next/navigation';

// The "boutique" page was renamed /abonnement (it only ever sold the student
// subscription — no real product catalog). Kept as a thin redirect for old
// bookmarks/external links; already noindexed, so no SEO impact.
export default function Page() {
  redirect('/abonnement');
}
