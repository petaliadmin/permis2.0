import type { Metadata } from 'next';
import CoursDetailClient from './CoursDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface LessonMeta {
  titre: string;
  contenu: string;
  category?: { label: string } | null;
}

// Lessons rarely change — revalidate periodically rather than hitting the API on every request.
async function fetchLesson(id: string): Promise<LessonMeta | null> {
  try {
    const res = await fetch(`${API_URL}/lessons/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lesson = await fetchLesson(id);
  if (!lesson) return { title: 'Leçon introuvable' };

  const description = lesson.contenu.replace(/\s+/g, ' ').trim().slice(0, 155);
  return {
    title: lesson.category ? `${lesson.titre} — ${lesson.category.label}` : lesson.titre,
    description,
    alternates: { canonical: `/cours/${id}` },
  };
}

export default function Page() {
  return <CoursDetailClient />;
}
