'use client';

import { motion } from 'framer-motion';
import { Button } from '@permis2.0/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@permis2.0/ui';
import { Progress } from '@permis2.0/ui';

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  enonce: string;
  signalisation?: string;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
}

export function QuestionCard({
  questionNumber,
  totalQuestions,
  enonce,
  signalisation,
  accuracy,
  correctCount,
  incorrectCount,
}: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Progression
          </span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {correctCount} ✓ {incorrectCount} ✗
          </span>
        </div>
        <Progress value={questionNumber} max={totalQuestions} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="border-2 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <div>
              <CardTitle className="text-xl md:text-2xl">
                Question {questionNumber}/{totalQuestions}
              </CardTitle>
            </div>
            {signalisation && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-4xl md:text-6xl"
              >
                {signalisation}
              </motion.div>
            )}
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-base md:text-lg text-gray-800 dark:text-white font-medium">
              {enonce}
            </p>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  );
}

interface AnswerChoiceProps {
  id: string;
  text: string;
  letter: string;
  isSelected: boolean;
  isAnswered: boolean;
  isCorrect?: boolean;
  onClick: () => void;
}

export function AnswerChoice({
  id,
  text,
  letter,
  isSelected,
  isAnswered,
  isCorrect,
  onClick,
}: AnswerChoiceProps) {
  const getBackgroundColor = () => {
    if (!isAnswered) {
      return isSelected
        ? 'bg-primary/10 border-primary'
        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-primary/50';
    }
    if (isSelected) {
      return isCorrect
        ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
        : 'bg-red-50 dark:bg-red-900/20 border-red-500';
    }
    return 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-50';
  };

  const getTextColor = () => {
    if (isAnswered && isSelected) {
      return isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400';
    }
    return 'text-gray-800 dark:text-white';
  };

  return (
    <motion.button
      whileHover={!isAnswered ? { scale: 1.02 } : {}}
      whileTap={!isAnswered ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={isAnswered}
      className={`w-full p-4 rounded-lg border-2 text-left transition-all font-medium ${getBackgroundColor()} ${
        isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`text-lg font-bold ${getTextColor()}`}>{letter}</span>
        <span className={getTextColor()}>{text}</span>
        {isAnswered && isSelected && (
          <span className="ml-auto text-lg">
            {isCorrect ? '✓' : '✗'}
          </span>
        )}
      </div>
    </motion.button>
  );
}

interface FeedbackCardProps {
  isCorrect: boolean;
  explanation: string;
  correctAnswers?: string[];
  xpEarned?: number;
}

export function FeedbackCard({
  isCorrect,
  explanation,
  correctAnswers,
  xpEarned = 0,
}: FeedbackCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-2 ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <motion.span
              initial={{ rotate: -20 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-3xl"
            >
              {isCorrect ? '✓' : '✗'}
            </motion.span>
            <CardTitle className={isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
              {isCorrect ? 'Bonne réponse!' : 'Mauvaise réponse'}
            </CardTitle>
            {isCorrect && xpEarned > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="ml-auto text-lg font-bold text-yellow-600 dark:text-yellow-400"
              >
                +{xpEarned} XP
              </motion.span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            {explanation}
          </p>
          {!isCorrect && correctAnswers && correctAnswers.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Bonne(s) réponse(s):</span> {correctAnswers.join(', ')}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ActionButtonsProps {
  onPrevious: () => void;
  onSubmit?: () => void;
  onNext: () => void;
  isPreviousDisabled: boolean;
  isAnswered: boolean;
  selectedAnswer: string | null;
  isLastQuestion: boolean;
}

export function ActionButtons({
  onPrevious,
  onSubmit,
  onNext,
  isPreviousDisabled,
  isAnswered,
  selectedAnswer,
  isLastQuestion,
}: ActionButtonsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="flex gap-3 md:gap-4 justify-between sticky bottom-0 bg-white dark:bg-gray-900 p-4 md:p-6 border-t"
    >
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isPreviousDisabled}
        size="sm"
        className="flex-1"
      >
        ← Précédente
      </Button>

      {!isAnswered && onSubmit ? (
        <Button
          onClick={onSubmit}
          disabled={!selectedAnswer}
          size="sm"
          className="flex-1"
        >
          Valider
        </Button>
      ) : (
        <Button onClick={onNext} size="sm" className="flex-1">
          {isLastQuestion ? 'Voir résultats →' : 'Suivante →'}
        </Button>
      )}
    </motion.div>
  );
}

export function LoadingSpinner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 gap-4"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
      />
      <p className="text-gray-600 dark:text-gray-400 text-center">
        Chargement des questions...
      </p>
    </motion.div>
  );
}
