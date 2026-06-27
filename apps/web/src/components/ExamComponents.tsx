'use client';

import { motion } from 'framer-motion';
import { Button } from '@permis2.0/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@permis2.0/ui';
import { Progress } from '@permis2.0/ui';

interface ExamTimerProps {
  timeRemaining: number;
  timeTotal: number;
  onTimeUp?: () => void;
}

export function ExamTimer({ timeRemaining, timeTotal }: ExamTimerProps) {
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const percentage = (timeRemaining / timeTotal) * 100;
  const isWarning = timeRemaining < 5 * 60 * 1000; // 5 minutes
  const isCritical = timeRemaining < 1 * 60 * 1000; // 1 minute

  const bgColor = isCritical ? 'bg-red-50 dark:bg-red-900/20' : isWarning ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-blue-50 dark:bg-blue-900/20';
  const borderColor = isCritical ? 'border-red-500' : isWarning ? 'border-yellow-500' : 'border-blue-500';
  const textColor = isCritical ? 'text-red-700 dark:text-red-400' : isWarning ? 'text-yellow-700 dark:text-yellow-400' : 'text-blue-700 dark:text-blue-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bgColor} border ${borderColor} p-4 rounded-lg`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Temps restant
          </p>
          <motion.p
            key={`${minutes}:${seconds.toString().padStart(2, '0')}`}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={`${textColor} text-2xl font-bold font-mono`}
          >
            {minutes}:{seconds.toString().padStart(2, '0')}
          </motion.p>
        </div>
        <div className="flex-1">
          <Progress value={percentage} max={100} className="h-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {isWarning ? '⚠️ Dépêchez-vous!' : 'Vous êtes en bon chemin'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

interface ExamStartScreenProps {
  totalQuestions: number;
  onStart: () => void;
  isLoading?: boolean;
}

export function ExamStartScreen({ totalQuestions, onStart, isLoading }: ExamStartScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl">
        <Card className="border-2 border-primary">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">📝</div>
            <CardTitle className="text-3xl">Examen Blanc</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-white">
                Règles de l'examen
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>{totalQuestions} questions à répondre</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>30 minutes pour compléter l'examen</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>Vous ne pouvez pas revenir en arrière</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>70% requis pour réussir</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>L'examen se termine automatiquement au bout de 30 minutes</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                    {totalQuestions}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Questions
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                    30:00
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Minutes
                  </p>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={onStart}
              disabled={isLoading}
              size="lg"
              className="w-full text-lg h-12"
            >
              {isLoading ? 'Chargement...' : 'Commencer l\'examen'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

interface ExamQuestionScreenProps {
  questionNumber: number;
  totalQuestions: number;
  question: any;
  selectedAnswer: string | null;
  isAnswered: boolean;
  timeRemaining: number;
  timeTotal: number;
  isSubmitting?: boolean;
  onSelectAnswer: (choiceId: string) => void;
  onSubmitAnswer: () => void;
  onNext: () => void;
}

export function ExamQuestionScreen({
  questionNumber,
  totalQuestions,
  question,
  selectedAnswer,
  isAnswered,
  timeRemaining,
  timeTotal,
  isSubmitting,
  onSelectAnswer,
  onSubmitAnswer,
  onNext,
}: ExamQuestionScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex flex-col">
      {/* Timer Header */}
      <header className="bg-white dark:bg-gray-900 shadow sticky top-0 z-10 p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Question {questionNumber} / {totalQuestions}
          </div>
          <ExamTimer timeRemaining={timeRemaining} timeTotal={timeTotal} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 flex flex-col">
        {/* Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <Progress value={questionNumber} max={totalQuestions} />
        </motion.div>

        {/* Question Card */}
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Card className="border-2 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-start mb-4">
                <CardTitle className="text-xl md:text-2xl">
                  Question {questionNumber}
                </CardTitle>
                {question.signalisation_visible && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="text-5xl md:text-6xl"
                  >
                    {question.signalisation_visible}
                  </motion.div>
                )}
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-base md:text-lg text-gray-800 dark:text-white font-medium">
                  {question.enonce}
                </p>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Answer Choices */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-8"
        >
          {question.choices.map((choice: any, idx: number) => {
            const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
            const letter = letters[choice.order - 1] || letters[idx];
            const isSelected = selectedAnswer === choice.id;

            return (
              <motion.button
                key={choice.id}
                whileHover={!isAnswered ? { scale: 1.02 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
                onClick={() => !isAnswered && onSelectAnswer(choice.id)}
                disabled={isAnswered || isSubmitting}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all font-medium ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
                } ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-primary">{letter}</span>
                  <span className="text-gray-800 dark:text-white">{choice.text}</span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />
      </main>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="sticky bottom-0 bg-white dark:bg-gray-900 border-t p-4 md:p-6"
      >
        <div className="max-w-5xl mx-auto flex gap-4">
          {!isAnswered ? (
            <>
              <Button
                variant="outline"
                onClick={onSubmitAnswer}
                disabled={!selectedAnswer || isSubmitting}
                className="flex-1"
                size="lg"
              >
                {isSubmitting ? 'Validation...' : 'Valider'}
              </Button>
              {questionNumber < totalQuestions && (
                <p className="text-xs text-gray-500 dark:text-gray-400 py-3">
                  Vous ne pouvez pas revenir en arrière
                </p>
              )}
            </>
          ) : (
            <Button
              onClick={onNext}
              disabled={isSubmitting}
              className="flex-1"
              size="lg"
            >
              {questionNumber === totalQuestions ? 'Voir les résultats →' : 'Question suivante →'}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface ExamResultsProps {
  result: any;
  onRetry: () => void;
  onHome: () => void;
}

export function ExamResults({ result, onRetry, onHome }: ExamResultsProps) {
  const passed = result.passed;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 p-4"
    >
      <div className="max-w-4xl mx-auto py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="text-6xl mb-4">
            {passed ? '🎉' : '💪'}
          </div>
          <h1 className={`text-4xl font-bold ${passed ? 'text-primary' : 'text-orange-600 dark:text-orange-400'}`}>
            {passed ? 'Examen réussi!' : 'Presque!'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {passed
              ? 'Félicitations! Vous avez réussi l\'examen blanc.'
              : 'Vous avez besoin de 70% pour réussir. Réessayez!'}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{result.percentage}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Réponses correctes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                {result.score}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">/ 40</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Temps utilisé</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {Math.floor(result.timeUsed / 60)}:
                {(result.timeUsed % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">min:sec</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>XP gagnés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                {result.xpEarned}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">points</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        {result.categoryBreakdown && Object.keys(result.categoryBreakdown).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>Résultats par catégorie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(result.categoryBreakdown).map(([catId, accuracy]: [string, any]) => (
                  <div key={catId}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium capitalize">
                        {catId.replace(/_/g, ' ')}
                      </span>
                      <span className={`font-bold ${accuracy >= 70 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {accuracy}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${accuracy}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className={`h-2 rounded-full ${accuracy >= 70 ? 'bg-green-600 dark:bg-green-400' : 'bg-orange-600 dark:bg-orange-400'}`}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4 justify-center"
        >
          <Button variant="outline" onClick={onRetry} size="lg">
            Réessayer
          </Button>
          <Button onClick={onHome} size="lg">
            Accueil
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400">Chargement de l'examen...</p>
      </div>
    </div>
  );
}
