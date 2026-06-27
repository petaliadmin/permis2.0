'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
  StatCard,
  CategoryBreakdown,
  RecommendationCard,
  StreakCard,
  ComparisonStat,
} from '@/components/StatisticsComponents';
import { Button } from '@permis2.0/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@permis2.0/ui';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface UserStatistics {
  totalTests: number;
  averageScore: number;
  bestScore: number;
  overallAccuracy: number;
  totalCorrectAnswers: number;
  totalQuestionsAnswered: number;
  currentLevel: string;
  totalXP: number;
}

export default function StatisticsPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [overview, setOverview] = useState<UserStatistics | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('auth-store')
          ? JSON.parse(localStorage.getItem('auth-store') || '{}').state?.token
          : null;

        if (!token) {
          throw new Error('Not authenticated');
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Fetch all statistics in parallel
        const [
          overviewRes,
          categoriesRes,
          weakAreasRes,
          recommendationsRes,
          streakRes,
          comparisonRes,
        ] = await Promise.all([
          fetch(`${API_URL}/statistics/overview`, { headers }),
          fetch(`${API_URL}/statistics/categories`, { headers }),
          fetch(`${API_URL}/statistics/weak-areas`, { headers }),
          fetch(`${API_URL}/statistics/recommendations`, { headers }),
          fetch(`${API_URL}/statistics/streak`, { headers }),
          fetch(`${API_URL}/statistics/comparison`, { headers }),
        ]);

        if (
          !overviewRes.ok ||
          !categoriesRes.ok ||
          !weakAreasRes.ok ||
          !recommendationsRes.ok ||
          !streakRes.ok ||
          !comparisonRes.ok
        ) {
          throw new Error('Failed to fetch statistics');
        }

        const [
          overviewData,
          categoriesData,
          weakAreasData,
          recommendationsData,
          streakData,
          comparisonData,
        ] = await Promise.all([
          overviewRes.json(),
          categoriesRes.json(),
          weakAreasRes.json(),
          recommendationsRes.json(),
          streakRes.json(),
          comparisonRes.json(),
        ]);

        setOverview(overviewData);
        setCategories(categoriesData);
        setWeakAreas(weakAreasData);
        setRecommendations(recommendationsData);
        setStreak(streakData);
        setComparison(comparisonData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load statistics';
        setError(message);
        console.error('Error fetching statistics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchStatistics();
    }
  }, [isAuthenticated, API_URL]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
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
              <Link href="/statistics" className="text-primary font-semibold">
                Statistiques
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Title */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-dark dark:text-white mb-2">
              Vos statistiques
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Suivez votre progression et identifiez vos points forts et faibles
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="mb-8 flex gap-2">
            {(['7', '30', '90'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                onClick={() => setTimeRange(range)}
                size="sm"
              >
                {range === '7' ? '7 jours' : range === '30' ? '30 jours' : '90 jours'}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Chargement des statistiques...
              </p>
            </div>
          ) : error ? (
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="pt-6">
                <p className="text-red-700 dark:text-red-400 mb-4">
                  Erreur: {error}
                </p>
                <Button onClick={() => window.location.reload()}>
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          ) : overview ? (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                  title="Tests complétés"
                  value={overview.totalTests}
                  subtitle="Examen blanc"
                  icon="📝"
                  color="primary"
                />
                <StatCard
                  title="Score moyen"
                  value={`${Math.round(overview.averageScore)}%`}
                  subtitle="Tous les tests"
                  icon="📊"
                  color="info"
                />
                <StatCard
                  title="Meilleur score"
                  value={`${overview.bestScore}%`}
                  subtitle="Votre record"
                  icon="🏆"
                  color="success"
                />
                <StatCard
                  title="Précision globale"
                  value={`${Math.round(overview.overallAccuracy)}%`}
                  subtitle={`${overview.totalCorrectAnswers}/${overview.totalQuestionsAnswered}`}
                  icon="✨"
                  color="warning"
                />
              </div>

              {/* Level and XP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <StatCard
                  title="Niveau actuel"
                  value={overview.currentLevel}
                  subtitle={`${overview.totalXP} XP`}
                  icon="⭐"
                  color="success"
                />
                <StatCard
                  title="Questions répondues"
                  value={overview.totalQuestionsAnswered}
                  subtitle={`${overview.totalCorrectAnswers} correctes`}
                  icon="✓"
                  color="primary"
                />
              </div>

              {/* Streak */}
              {streak && <div className="mb-8">{<StreakCard {...streak} />}</div>}

              {/* Category Breakdown */}
              {categories.length > 0 && (
                <div className="mb-8">
                  <CategoryBreakdown categories={categories} />
                </div>
              )}

              {/* Recommendations */}
              {recommendations && (
                <div className="mb-8">
                  <RecommendationCard {...recommendations} />
                </div>
              )}

              {/* Comparison Stats */}
              {comparison && (
                <div className="mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Comparaison avec la moyenne</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Vous êtes dans le top {Math.round(100 - comparison.userPercentile)}% des utilisateurs
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ComparisonStat
                        label="Score moyen"
                        userValue={Math.round(comparison.userStats.averageScore * 100) / 100}
                        globalValue={Math.round(comparison.globalAverage.averageScore * 100) / 100}
                        unit="%"
                        isBetter={comparison.userStats.averageScore >= comparison.globalAverage.averageScore}
                      />
                      <ComparisonStat
                        label="Précision"
                        userValue={Math.round(comparison.userStats.overallAccuracy * 100) / 100}
                        globalValue={Math.round(comparison.globalAverage.averageAccuracy * 100) / 100}
                        unit="%"
                        isBetter={comparison.userStats.overallAccuracy >= comparison.globalAverage.averageAccuracy}
                      />
                      <ComparisonStat
                        label="Temps par question"
                        userValue={Math.round(comparison.userStats.timeSpentTraining / comparison.userStats.totalQuestionsAnswered || 0)}
                        globalValue={Math.round(comparison.globalAverage.averageTimePerQuestion)}
                        unit="s"
                        isBetter={
                          (comparison.userStats.timeSpentTraining /
                            comparison.userStats.totalQuestionsAnswered ||
                            0) <=
                          comparison.globalAverage.averageTimePerQuestion
                        }
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Back Button */}
              <div className="text-center">
                <Button variant="outline" onClick={() => window.history.back()}>
                  ← Retour
                </Button>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </ProtectedRoute>
  );
}
