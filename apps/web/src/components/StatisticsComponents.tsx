'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@permis2.0/ui';
import { Progress } from '@permis2.0/ui';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
}: StatCardProps) {
  const colorClasses = {
    primary: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700',
    success: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700',
    warning: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700',
    danger: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700',
    info: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
    >
      <Card className={`border-2 bg-gradient-to-br ${colorClasses[color]}`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {title}
              </p>
              <motion.p
                key={value}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-gray-800 dark:text-white mt-2"
              >
                {value}
              </motion.p>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {icon && (
              <div className="text-3xl opacity-20">{icon}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface CategoryBreakdownProps {
  categories: Array<{
    categoryName: string;
    successRate: number;
    correctAnswers: number;
    totalAnswers: number;
  }>;
  title?: string;
}

export function CategoryBreakdown({
  categories,
  title = 'Résultats par catégorie',
}: CategoryBreakdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.categoryName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {cat.categoryName}
                </span>
                <span className={`text-sm font-bold ${
                  cat.successRate >= 70
                    ? 'text-green-600 dark:text-green-400'
                    : cat.successRate >= 50
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {Math.round(cat.successRate)}%
                </span>
              </div>
              <Progress
                value={cat.successRate}
                max={100}
                className="h-2"
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {cat.correctAnswers}/{cat.totalAnswers} correctes
              </p>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface RecommendationProps {
  weakAreas: string[];
  suggestions: string[];
}

export function RecommendationCard({
  weakAreas,
  suggestions,
}: RecommendationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💡</span>
            Recommandations personnalisées
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {weakAreas.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white mb-2">
                Domaines à améliorer
              </h3>
              <ul className="space-y-1">
                {weakAreas.map((area) => (
                  <li key={area} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span>🎯</span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggestions.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white mb-2">
                Suggestions
              </h3>
              <ul className="space-y-2">
                {suggestions.map((suggestion) => (
                  <li key={suggestion} className="text-sm text-gray-700 dark:text-gray-300">
                    ✓ {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakCard({
  currentStreak,
  longestStreak,
}: StreakDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-2">🔥</div>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {currentStreak}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Streak actuelle
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-2">⭐</div>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {longestStreak}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Meilleur streak
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

interface ComparisonStatProps {
  label: string;
  userValue: number;
  globalValue: number;
  unit?: string;
  isBetter?: boolean;
}

export function ComparisonStat({
  label,
  userValue,
  globalValue,
  unit = '',
  isBetter,
}: ComparisonStatProps) {
  const isUserBetter = isBetter !== undefined ? isBetter : userValue >= globalValue;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
    >
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </p>
        <div className="flex gap-4 mt-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-500">Vous</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {userValue}{unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-500">Moyenne</p>
            <p className="text-lg font-bold text-gray-500 dark:text-gray-400">
              {globalValue}{unit}
            </p>
          </div>
        </div>
      </div>
      <span className="text-2xl">
        {isUserBetter ? '📈' : '📉'}
      </span>
    </motion.div>
  );
}
