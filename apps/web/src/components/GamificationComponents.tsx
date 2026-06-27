'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@permis2.0/ui';
import { Progress } from '@permis2.0/ui';

interface BadgeDisplayProps {
  icon: string;
  name: string;
  description: string;
  unlockedAt?: Date;
  isNew?: boolean;
}

export function BadgeDisplay({
  icon,
  name,
  description,
  unlockedAt,
  isNew,
}: BadgeDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="relative"
    >
      {isNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
        >
          ✨
        </motion.div>
      )}
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-lg border-2 border-yellow-300 dark:border-yellow-700 text-center hover:shadow-lg transition-shadow">
        <div className="text-4xl mb-2">{icon}</div>
        <h4 className="font-bold text-sm text-gray-800 dark:text-white">{name}</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        {unlockedAt && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {new Date(unlockedAt).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>
    </motion.div>
  );
}

interface LevelProgressProps {
  currentXP: number;
  nextLevelXP: number;
  level: string;
  totalXP: number;
}

export function LevelProgress({
  currentXP,
  nextLevelXP,
  level,
  totalXP,
}: LevelProgressProps) {
  const levelThresholds = {
    'Débutant': 0,
    'Intermédiaire': 100,
    'Confirmé': 300,
    'Expert': 600,
  };

  const currentThreshold = levelThresholds[level as keyof typeof levelThresholds] || 0;
  const nextThreshold =
    level === 'Expert'
      ? 600
      : Object.values(levelThresholds)[
          Object.keys(levelThresholds).indexOf(level) + 1
        ];

  const xpInLevel = totalXP - currentThreshold;
  const xpNeededForLevel = nextThreshold - currentThreshold;
  const percentage = (xpInLevel / xpNeededForLevel) * 100;

  const levelColors = {
    'Débutant': 'from-blue-500 to-blue-600',
    'Intermédiaire': 'from-green-500 to-green-600',
    'Confirmé': 'from-purple-500 to-purple-600',
    'Expert': 'from-yellow-500 to-yellow-600',
  };

  const bgColor =
    levelColors[level as keyof typeof levelColors] || 'from-gray-500 to-gray-600';

  return (
    <Card className={`bg-gradient-to-r ${bgColor}`}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">Niveau {level}</CardTitle>
          <span className="text-white text-2xl font-bold">{level.charAt(0)}</span>
        </div>
      </CardHeader>
      <CardContent className="text-white space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Progression</span>
            <span className="text-sm font-bold">
              {xpInLevel} / {xpNeededForLevel} XP
            </span>
          </div>
          <Progress
            value={percentage}
            max={100}
            className="h-3 bg-white/30"
          />
        </div>
        <div className="text-sm opacity-90">
          <p>Total XP: {totalXP}</p>
          {level !== 'Expert' && (
            <p>{nextThreshold - totalXP} XP avant le prochain niveau</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border-2 border-orange-300 dark:border-orange-700"
      >
        <div className="text-3xl mb-2">🔥</div>
        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
          {currentStreak}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Streak actuelle</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border-2 border-purple-300 dark:border-purple-700"
      >
        <div className="text-3xl mb-2">⭐</div>
        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {longestStreak}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Meilleur streak</p>
      </motion.div>
    </div>
  );
}

interface LeaderboardEntryProps {
  rank: number;
  name: string;
  xp: number;
  level: string;
  avatar?: string;
  isCurrentUser?: boolean;
}

export function LeaderboardEntry({
  rank,
  name,
  xp,
  level,
  avatar,
  isCurrentUser,
}: LeaderboardEntryProps) {
  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
        isCurrentUser
          ? 'bg-primary/10 border-primary'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      } hover:shadow-lg transition-shadow`}
    >
      {/* Rank */}
      <div className="w-10 text-center">
        {getMedalEmoji(rank) ? (
          <span className="text-2xl">{getMedalEmoji(rank)}</span>
        ) : (
          <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
            #{rank}
          </span>
        )}
      </div>

      {/* Avatar & Name */}
      <div className="flex-1 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            name.charAt(0)
          )}
        </div>
        <div>
          <p className="font-bold text-gray-800 dark:text-white">
            {name}
            {isCurrentUser && ' (vous)'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{level}</p>
        </div>
      </div>

      {/* XP */}
      <div className="text-right">
        <p className="text-lg font-bold text-primary">{xp}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">XP</p>
      </div>
    </motion.div>
  );
}

interface AchievementNotificationProps {
  icon: string;
  title: string;
  description: string;
  onClose: () => void;
}

export function AchievementNotification({
  icon,
  title,
  description,
  onClose,
}: AchievementNotificationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onAnimationComplete={() => {
        setTimeout(onClose, 3000);
      }}
      className="fixed top-4 right-4 max-w-sm z-50"
    >
      <Card className="bg-gradient-to-r from-yellow-400 to-yellow-500 border-2 border-yellow-600">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6 }}
              className="text-4xl"
            >
              {icon}
            </motion.div>
            <div className="flex-1">
              <h3 className="font-bold text-white">{title}</h3>
              <p className="text-sm text-white/90 mt-1">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface LevelUpAnimationProps {
  oldLevel: string;
  newLevel: string;
  xpEarned: number;
}

export function LevelUpAnimation({
  oldLevel,
  newLevel,
  xpEarned,
}: LevelUpAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="text-center"
      >
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-8xl mb-4"
        >
          🎉
        </motion.div>
        <h1 className="text-4xl font-bold text-white mb-2">Niveau augmenté!</h1>
        <p className="text-2xl text-yellow-300 mb-4">
          {oldLevel} → {newLevel}
        </p>
        <p className="text-xl text-white">
          +{xpEarned} XP gagnés! 🌟
        </p>

        {/* Confetti particles */}
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 1,
              x: Math.random() * 200 - 100,
              y: 0,
            }}
            animate={{
              opacity: 0,
              y: 500,
              rotate: Math.random() * 360,
            }}
            transition={{
              duration: 2,
              ease: 'easeOut',
              delay: i * 0.05,
            }}
            className="fixed w-4 h-4 bg-yellow-300 rounded-full"
            style={{
              left: '50%',
              top: '50%',
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
