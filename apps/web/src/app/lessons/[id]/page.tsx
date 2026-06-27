'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useContentStore } from '@/store/contentStore';
import { Card, CardContent, CardHeader, CardTitle } from '@permis2.0/ui';
import { Button } from '@permis2.0/ui';
import { Badge } from '@permis2.0/ui';
import Link from 'next/link';

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const selectedLesson = useContentStore((state) => state.selectedLesson);
  const lessonsLoading = useContentStore((state) => state.lessonsLoading);
  const favorites = useContentStore((state) => state.favorites);
  const fetchLesson = useContentStore((state) => state.fetchLesson);
  const toggleFavorite = useContentStore((state) => state.toggleFavorite);

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (isAuthenticated && params.id) {
      const lessonId = Array.isArray(params.id) ? params.id[0] : params.id;
      fetchLesson(lessonId);
    }
  }, [isAuthenticated, params.id, fetchLesson]);

  useEffect(() => {
    if (selectedLesson) {
      setIsFavorite(favorites.has(selectedLesson.id));
    }
  }, [selectedLesson, favorites]);

  const handleToggleFavorite = async () => {
    if (selectedLesson) {
      await toggleFavorite(selectedLesson.id);
    }
  };

  const handleTextToSpeech = () => {
    if (selectedLesson && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(selectedLesson.contenu);
      utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
    }
  };

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {lessonsLoading ? (
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ) : selectedLesson ? (
          <>
            {/* Title and Actions */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-dark dark:text-white mb-2">
                    {selectedLesson.titre}
                  </h1>
                  <div className="flex gap-2">
                    <Badge variant="default">
                      {selectedLesson.category?.label}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={isFavorite ? 'default' : 'outline'}
                    onClick={handleToggleFavorite}
                  >
                    {isFavorite ? '❤️ Favori' : '🤍 Ajouter'}
                  </Button>
                  <Button variant="outline" onClick={handleTextToSpeech}>
                    🔊 Écouter
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Contenu</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedLesson.contenu}
                </p>
              </CardContent>
            </Card>

            {/* Key Points */}
            {selectedLesson.points_cles && selectedLesson.points_cles.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Points clés</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {selectedLesson.points_cles.map((point: string, i: number) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-primary font-bold">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Rules */}
            {selectedLesson.regles && selectedLesson.regles.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Règles importantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {selectedLesson.regles.map((rule: string, i: number) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-secondary font-bold">⚠️</span>
                        <span className="text-gray-700 dark:text-gray-300">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Exceptions */}
            {selectedLesson.exceptions && selectedLesson.exceptions.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Exceptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {selectedLesson.exceptions.map((exception: string, i: number) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-danger font-bold">!</span>
                        <span className="text-gray-700 dark:text-gray-300">{exception}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Common Mistakes */}
            {selectedLesson.erreurs_frequentes && selectedLesson.erreurs_frequentes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Erreurs fréquentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {selectedLesson.erreurs_frequentes.map((error: string, i: number) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-danger font-bold">✗</span>
                        <span className="text-gray-700 dark:text-gray-300">{error}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Leçon non trouvée
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
