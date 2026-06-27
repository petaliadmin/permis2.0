'use client';

import { motion } from 'framer-motion';
import { Button } from '@permis2.0/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@permis2.0/ui';
import { Progress } from '@permis2.0/ui';

interface InsightCardProps {
  type: 'strength' | 'weakness' | 'improvement' | 'trend';
  title: string;
  description: string;
  icon: string;
  actionable: boolean;
  onAction?: () => void;
}

export function InsightCard({
  type,
  title,
  description,
  icon,
  actionable,
  onAction,
}: InsightCardProps) {
  const colors: Record<string, string> = {
    strength: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700',
    weakness: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700',
    improvement: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700',
    trend: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
    >
      <Card className={`border-2 bg-gradient-to-br ${colors[type]} cursor-pointer`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{icon}</span>
                <h3 className="font-bold text-gray-800 dark:text-white">{title}</h3>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {description}
              </p>
              {actionable && onAction && (
                <Button
                  size="sm"
                  onClick={onAction}
                  className="mt-2"
                >
                  Agir →
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface RecommendationPathProps {
  step: number;
  title: string;
  description: string;
  action: 'learn' | 'practice' | 'test';
  estimatedTime: number;
  priority: 'high' | 'medium' | 'low';
  onClick: () => void;
}

export function RecommendationPath({
  step,
  title,
  description,
  action,
  estimatedTime,
  priority,
  onClick,
}: RecommendationPathProps) {
  const actionIcons: Record<string, string> = {
    learn: '📚',
    practice: '✍️',
    test: '🧪',
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 10 }}
    >
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {/* Step number */}
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold">
                {step}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <span>{actionIcons[action]}</span>
                    {title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {description}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${priorityColors[priority]}`}>
                  {priority === 'high' ? 'Haute' : priority === 'medium' ? 'Moyenne' : 'Basse'}
                </span>
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  ⏱️ ~{estimatedTime} min
                </span>
                <Button size="sm" onClick={onClick}>
                  Commencer →
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface MilestoneProps {
  milestone: string;
  progress: number; // 0-100
}

export function Milestone({ milestone, progress }: MilestoneProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {milestone}
          </p>
          <Progress value={progress} max={100} className="h-2" />
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {progress}% complété
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface MotivationalMessageProps {
  message: string;
}

export function MotivationalMessage({ message }: MotivationalMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700">
        <CardContent className="pt-6 text-center">
          <p className="text-lg font-semibold text-gray-800 dark:text-white">
            {message}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            💬 Message personnalisé de votre coach IA
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface PersonalizedQuizProps {
  title: string;
  description: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  targetCategories: string[];
  onClick: () => void;
}

export function PersonalizedQuizCard({
  title,
  description,
  questionCount,
  difficulty,
  estimatedTime,
  targetCategories,
  onClick,
}: PersonalizedQuizProps) {
  const difficultyEmoji: Record<string, string> = {
    easy: '🟢',
    medium: '🟡',
    hard: '🔴',
  };

  const difficultyLabel: Record<string, string> = {
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <span className="text-3xl">🎯</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">{description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Questions</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {questionCount}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Difficulté</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {difficultyEmoji[difficulty]} {difficultyLabel[difficulty]}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Temps</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                ~{estimatedTime}m
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Catégories</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {targetCategories.length}
              </p>
            </div>
          </div>

          <button
            onClick={onClick}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Commencer le quiz →
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
