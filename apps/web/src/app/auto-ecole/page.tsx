import { redirect } from 'next/navigation';

// The old "pack école" (bulk seat codes for students) is gone — auto-écoles
// now subscribe directly from their own management space.
export default function Page() {
  redirect('/mon-ecole');
}
