'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { LeaderboardEntry } from '@/components/GamificationComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@permis2.0/ui';
import { Button } from '@permis2.0/ui';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  xp: number;
  level: string;
}

interface UserRank {
  rank: number;
  totalUsers: number;
  xp: number;
  level: string;
}

export default function LeaderboardPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/gamification/leaderboard?limit=100`);
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        const data = await response.json();
        setLeaderboard(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load leaderboard';
        setError(message);
        console.error('Error fetching leaderboard:', err);
      }
    };

    const fetchUserRank = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const token = localStorage.getItem('auth-store')
          ? JSON.parse(localStorage.getItem('auth-store') || '{}').state?.token
          : null;

        if (!token) return;

        const response = await fetch(`${API_URL}/gamification/rank`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch rank');
        }
        const data = await response.json();
        setUserRank(data);
      } catch (err) {
        console.error('Error fetching rank:', err);
      }
    };

    Promise.all([fetchLeaderboard(), fetchUserRank()]).finally(() => {
      setIsLoading(false);
    });
  }, [isAuthenticated, user, API_URL]);

  if (!isAuthenticated) {
    return null;
  }

  return (
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
            <Link href="/leaderboard" className="text-primary font-semibold">
              Classement
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-dark dark:text-white mb-2">
            Classement mondial
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Les meilleurs apprenants de PERMIS2.0
          </p>
        </div>

        {/* User Rank Card */}
        {userRank && (
          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary">
            <CardHeader>
              <CardTitle>Votre position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rang</p>
                  <p className="text-3xl font-bold text-primary">#{userRank.rank}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total utilisateurs</p>
                  <p className="text-3xl font-bold text-dark dark:text-white">
                    {userRank.totalUsers}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">XP</p>
                  <p className="text-3xl font-bold text-secondary">{userRank.xp}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Niveau</p>
                  <p className="text-3xl font-bold text-primary">{userRank.level}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement du classement...</p>
          </div>
        ) : error ? (
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <p className="text-red-700 dark:text-red-400">
                Erreur lors du chargement du classement: {error}
              </p>
            </CardContent>
          </Card>
        ) : leaderboard.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600 dark:text-gray-400">
                Aucun utilisateur dans le classement pour le moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((u, idx) => (
              <LeaderboardEntry
                key={u.id}
                rank={idx + 1}
                name={u.name}
                xp={u.xp}
                level={u.level}
                avatar={u.avatar}
                isCurrentUser={isAuthenticated && user?.id === u.id}
              />
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            ← Retour
          </Button>
        </div>
      </main>
    </div>
  );
}
