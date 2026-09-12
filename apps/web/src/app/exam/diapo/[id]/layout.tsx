import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Examen blanc',
  robots: { index: false, follow: false },
};

export default function ExamDiapoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
