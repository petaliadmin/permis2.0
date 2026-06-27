'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTrainingStore } from '@/store/trainingStore';
import { Button } from '@permis2.0/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@permis2.0/ui';

export default function TrainingPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const series = useTrainingStore((state) => state.series);
  const seriesLoading = useTrainingStore((state) => state.seriesLoading);
  const fetchAllSeries = useTrainingStore((state) => state.fetchAllSeries);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllSeries();
    }
  }, [isAuthenticated, fetchAllSeries]);

  if (!isAuthenticated) {
    return null;
  }

  const seriesList = [
    { code: 'B1', name: 'Série 1', description: '25 questions du permis B', color: 'from-blue-500' },
    { code: 'B2', name: 'Série 2', description: '25 questions du permis B', color: 'from-green-500' },
    { code: 'B3', name: 'Série 3', description: '25 questions du permis B', color: 'from-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-dark dark:to-dark">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            PERMIS2.0
          </Link>
          <nav className="flex gap-4">
            <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-primary">
              Accueil
            </Link>
            <Link href="/training" className="text-primary font-semibold">
              Entraînement
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-dark dark:text-white mb-2">
            Séries d'entraînement
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Pratiquez avec les trois séries de 25 questions
          </p>
        </div>

        {seriesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {seriesList.map((serie) => (
              <Card
                key={serie.code}
                className={`bg-gradient-to-br ${serie.color} to-transparent hover:shadow-lg transition-shadow`}
              >
                <CardHeader>
                  <CardTitle className="text-white">{serie.name}</CardTitle>
                  <CardDescription className="text-white/80">
                    {serie.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button
                    className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
                    onClick={() => router.push(`/training/${serie.code}`)}
                  >
                    Commencer
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-white text-white hover:bg-white/10"
                  >
                    Reprendre
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Comment fonctionne l'entraînement ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <span className="text-3xl">🎯</span>
              <div>
                <h3 className="font-semibold mb-1">Répondez aux questions</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Une question à la fois avec 4 réponses possibles
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-3xl">✨</span>
              <div>
                <h3 className="font-semibold mb-1">Gagnez de l'XP</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  10 XP par bonne réponse pour progresser dans les niveaux
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-3xl">📊</span>
              <div>
                <h3 className="font-semibold mb-1">Suivez vos progrès</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Consultez vos statistiques et identifiez vos points faibles
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
