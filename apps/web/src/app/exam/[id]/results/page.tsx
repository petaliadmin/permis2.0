'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useExamStore } from '@/store/examStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { ExamResults } from '@/components/ExamComponents';
import { AchievementNotification } from '@/components/GamificationComponents';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import type { BadgeType } from '@permis2.0/types';

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const examId = Array.isArray(params.id) ? params.id[0] : params.id;
  const result = useExamStore((state) => state.result);
  const resetExam = useExamStore((state) => state.resetExam);

  const fetchUserProfile = useGamificationStore((state) => state.fetchUserProfile);
  const checkAchievements = useGamificationStore((state) => state.checkAchievements);

  // Queue of newly unlocked badges to surface as toasts (one at a time)
  const [unlockedBadges, setUnlockedBadges] = useState<BadgeType[]>([]);

  // After an exam completes, sync XP/level and surface any new achievements.
  useEffect(() => {
    if (!result || !isAuthenticated) return;

    let cancelled = false;

    (async () => {
      const newBadges = await checkAchievements();
      // Refresh the profile so XP/level reflect rewards from this exam.
      await fetchUserProfile();

      if (!cancelled && newBadges.length > 0) {
        setUnlockedBadges(newBadges);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Run once per loaded result.
  }, [result, isAuthenticated, checkAchievements, fetchUserProfile]);

  if (!isAuthenticated) {
    return null;
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des résultats...</p>
        </div>
      </div>
    );
  }

  const handleRetry = () => {
    resetExam();
    router.push('/exam');
  };

  const handleHome = () => {
    resetExam();
    router.push('/');
  };

  const currentBadge = unlockedBadges[0] ?? null;

  const handleCloseNotification = () => {
    // Drop the front badge; the next one (if any) then animates in.
    setUnlockedBadges((badges) => badges.slice(1));
  };

  return (
    <ProtectedRoute>
      <AnimatePresence>
        {currentBadge && (
          <AchievementNotification
            key={currentBadge.id}
            icon={currentBadge.icon}
            title={currentBadge.name}
            description={currentBadge.description}
            onClose={handleCloseNotification}
          />
        )}
      </AnimatePresence>
      <ExamResults
        result={result}
        onRetry={handleRetry}
        onHome={handleHome}
      />
    </ProtectedRoute>
  );
}
