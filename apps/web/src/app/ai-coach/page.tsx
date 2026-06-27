'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  InsightCard,
  RecommendationPath,
  Milestone,
  MotivationalMessage,
  PersonalizedQuizCard,
} from '@/components/AiCoachComponents';
import { Button } from '@permis2.0/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@permis2.0/ui';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface CoachAnalysis {
  insights: any[];
  recommendations: any[];
  personalizedQuiz: any;
  nextMilestones: string[];
  motivationalMessage: string;
}

export default function AiCoachPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [analysis, setAnalysis] = useState<CoachAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('auth-store')
          ? JSON.parse(localStorage.getItem('auth-store') || '{}').state?.token
          : null;

        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_URL}/ai-coach/analysis`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch AI coach analysis');
        }

        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load analysis';
        setError(message);
        console.error('Error fetching analysis:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchAnalysis();
    }
  }, [isAuthenticated, API_URL]);

  const handleStartPractice = (categoryId: string) => {
    router.push(`/training?category=${categoryId}`);
  };

  const handleStartQuiz = () => {
    // Navigate to personalized quiz (would need quiz implementation)
    router.push('/training');
  };

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
              <Link href="/ai-coach" className="text-primary font-semibold">
                Coach IA
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Title */}
          <div className="mb-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h1 className="text-4xl font-bold text-dark dark:text-white mb-2">
              Votre Coach IA Personnalisé
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Recommandations intelligentes basées sur votre progression
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Votre coach réfléchit...
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
          ) : analysis ? (
            <>
              {/* Motivational Message */}
              <div className="mb-12">
                <MotivationalMessage message={analysis.motivationalMessage} />
              </div>

              {/* Insights */}
              {analysis.insights.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-dark dark:text-white mb-6">
                    🎯 Vos Insights
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.insights.map((insight: any, idx: number) => (
                      <InsightCard
                        key={idx}
                        {...insight}
                        onAction={() => {
                          if (insight.actionable && insight.type === 'weakness') {
                            handleStartPractice('all-weak');
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Personalized Quiz */}
              {analysis.personalizedQuiz && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-dark dark:text-white mb-6">
                    📝 Quiz Personnalisé
                  </h2>
                  <PersonalizedQuizCard
                    {...analysis.personalizedQuiz}
                    onClick={handleStartQuiz}
                  />
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-dark dark:text-white mb-6">
                    📋 Votre Plan d'Apprentissage
                  </h2>
                  <div className="space-y-4">
                    {analysis.recommendations.map((rec: any, idx: number) => (
                      <RecommendationPath
                        key={idx}
                        {...rec}
                        onClick={() => {
                          if (rec.action === 'practice') {
                            handleStartPractice(rec.target);
                          } else if (rec.action === 'test') {
                            router.push('/exam');
                          } else if (rec.action === 'learn') {
                            router.push('/lessons');
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Next Milestones */}
              {analysis.nextMilestones.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-dark dark:text-white mb-6">
                    🏆 Vos Prochains Objectifs
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.nextMilestones.map((milestone: string, idx: number) => (
                      <Milestone
                        key={idx}
                        milestone={milestone}
                        progress={Math.random() * 60 + 10} // Simulated progress
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => window.history.back()}>
                  ← Retour
                </Button>
                <Link href="/statistics">
                  <Button>Voir Statistiques →</Button>
                </Link>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </ProtectedRoute>
  );
}
