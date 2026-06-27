'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useContentStore } from '@/store/contentStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@permis2.0/ui';
import { Button } from '@permis2.0/ui';
import Link from 'next/link';

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const selectedCategory = useContentStore((state) => state.selectedCategory);
  const lessons = useContentStore((state) => state.lessons);
  const lessonsLoading = useContentStore((state) => state.lessonsLoading);
  const fetchCategoryById = useContentStore((state) => state.fetchCategoryById);
  const fetchLessonsByCategory = useContentStore((state) => state.fetchLessonsByCategory);

  useEffect(() => {
    if (isAuthenticated && params.id) {
      const categoryId = Array.isArray(params.id) ? params.id[0] : params.id;
      fetchCategoryById(categoryId);
      fetchLessonsByCategory(categoryId);
    }
  }, [isAuthenticated, params.id, fetchCategoryById, fetchLessonsByCategory]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-dark dark:to-dark">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            PERMIS2.0
          </Link>
          <Button variant="ghost" onClick={() => router.back()}>
            ← Retour
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {selectedCategory && (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="text-6xl"
                  dangerouslySetInnerHTML={{ __html: selectedCategory.icone }}
                />
                <div>
                  <h1 className="text-4xl font-bold text-dark dark:text-white">
                    {selectedCategory.label}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedCategory.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle>Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {selectedCategory.questionCount}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Leçons</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-secondary">
                    {selectedCategory.lessonCount}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Lessons */}
            <h2 className="text-2xl font-bold mb-6">Leçons</h2>

            {lessonsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : lessons.length > 0 ? (
              <div className="space-y-4">
                {lessons.map((lesson: any) => (
                  <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle>{lesson.titre}</CardTitle>
                        <CardDescription>
                          {lesson.contenu.substring(0, 100)}...
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    Aucune leçon disponible pour le moment
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
