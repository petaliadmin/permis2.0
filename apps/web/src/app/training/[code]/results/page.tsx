'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useTrainingStore } from '@/store/trainingStore';
import { Button } from '@permis2.0/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@permis2.0/ui';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const correctAnswers = useTrainingStore((state) => state.correctAnswers);
  const incorrectAnswers = useTrainingStore((state) => state.incorrectAnswers);
  const calculateAccuracy = useTrainingStore((state) => state.calculateAccuracy);
  const getSessionStats = useTrainingStore((state) => state.getSessionStats);
  const getCategoryStats = useTrainingStore((state) => state.getCategoryStats);
  const results = useTrainingStore((state) => state.results);
  const resetSeries = useTrainingStore((state) => state.resetSeries);

  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  const total = correctAnswers + incorrectAnswers;
  const accuracy = calculateAccuracy();
  const passed = accuracy >= 70;
  const { totalTime, avgTimePerQuestion } = getSessionStats();
  const categoryStats = getCategoryStats();

  const handleNewSeries = () => {
    resetSeries();
    router.push('/training');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-dark dark:to-dark">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            PERMIS2.0
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Result Status */}
        <Card className={`mb-12 border-2 ${passed ? 'border-primary' : 'border-danger'}`}>
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">
              {passed ? '🎉' : '💪'}
            </div>
            <CardTitle className={`text-3xl ${passed ? 'text-primary' : 'text-danger'}`}>
              {passed ? 'Série réussie!' : 'Allez-y encore!'}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{accuracy}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bonnes réponses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-500">{correctAnswers}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">/ {total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mauvaises réponses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-danger">{incorrectAnswers}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">/ {total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>XP gagnés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-secondary">
                {correctAnswers * 10}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">points</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Temps moyen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-500">
                {avgTimePerQuestion}s
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">par question</p>
            </CardContent>
          </Card>
        </div>

        {/* Analysis */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Analyse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Taux de réussite</span>
                <span className="font-bold text-primary">{accuracy}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${accuracy}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex gap-3">
                <span className="text-3xl">✓</span>
                <div>
                  <p className="font-semibold">{correctAnswers} réponses correctes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Continuez ainsi!
                  </p>
                </div>
              </div>

              {incorrectAnswers > 0 && (
                <div className="flex gap-3">
                  <span className="text-3xl">✗</span>
                  <div>
                    <p className="font-semibold">{incorrectAnswers} réponses incorrectes</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      À réviser
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={handleNewSeries}>
            Essayer une autre série
          </Button>
          <Button onClick={() => router.push('/training')}>
            Retour aux séries
          </Button>
        </div>

        {/* Category Breakdown */}
        {Object.keys(categoryStats).length > 0 && (
          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Résultats par catégorie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(categoryStats).map(([catId, accuracy]) => (
                <div key={catId}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium capitalize text-sm">
                      {catId.replace(/_/g, ' ')}
                    </span>
                    <span className={`font-bold text-sm ${accuracy >= 70 ? 'text-primary' : 'text-danger'}`}>
                      {accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        accuracy >= 70 ? 'bg-primary' : 'bg-danger'
                      }`}
                      style={{ width: `${accuracy}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {!passed && (
          <Card className="mt-12 bg-warning/5 border-warning">
            <CardHeader>
              <CardTitle className="text-warning">💡 Conseil</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                Vous avez besoin de 70% pour réussir. Revoyez les leçons et les catégories
                où vous avez eu du mal, puis réessayez cette série.
              </p>
              <Link href="/categories">
                <Button className="mt-4" variant="outline">
                  Consulter les catégories
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
