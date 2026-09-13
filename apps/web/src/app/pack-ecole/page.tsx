import { redirect } from 'next/navigation';

// Seat-code redemption is gone along with the old "pack école" — there are
// no more codes to activate.
export default function Page() {
  redirect('/');
}
