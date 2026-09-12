import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Réviser mes erreurs',
  robots: { index: false, follow: false },
};

export default function ErreursLayout({ children }: { children: React.ReactNode }) {
  return children;
}
