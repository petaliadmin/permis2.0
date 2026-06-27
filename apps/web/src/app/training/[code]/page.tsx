'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTrainingStore } from '@/store/trainingStore';
import { Button } from '@permis2.0/ui';
import {
  QuestionCard,
  AnswerChoice,
  FeedbackCard,
  ActionButtons,
  LoadingSpinner,
} from '@/components/TrainingComponents';

export default function SeriesTrainingPage() {
  const params = useParams();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const currentQuestion = useTrainingStore((state) => state.currentQuestion);
  const questionIndex = useTrainingStore((state) => state.questionIndex);
  const totalQuestions = useTrainingStore((state) => state.totalQuestions);
  const questionsLoading = useTrainingStore((state) => state.questionsLoading);
  const answers = useTrainingStore((state) => state.answers);
  const correctAnswers = useTrainingStore((state) => state.correctAnswers);
  const incorrectAnswers = useTrainingStore((state) => state.incorrectAnswers);

  const loadSeriesByCode = useTrainingStore((state) => state.loadSeriesByCode);
  const submitAnswer = useTrainingStore((state) => state.submitAnswer);
  const nextQuestion = useTrainingStore((state) => state.nextQuestion);
  const previousQuestion = useTrainingStore((state) => state.previousQuestion);
  const calculateAccuracy = useTrainingStore((state) => state.calculateAccuracy);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  useEffect(() => {
    if (isAuthenticated && code) {
      loadSeriesByCode(code);
    }
  }, [isAuthenticated, code, loadSeriesByCode]);

  useEffect(() => {
    // Reset answer state when question changes
    const answeredQuestion = answers.get(currentQuestion?.id || '');
    setSelectedAnswer(answeredQuestion || null);
    setIsAnswered(!!answeredQuestion);
    setShowFeedback(false);
  }, [currentQuestion, answers]);

  const handleSelectAnswer = (choiceId: string) => {
    if (!isAnswered) {
      setSelectedAnswer(choiceId);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) return;

    await submitAnswer(currentQuestion.id, selectedAnswer);
    setIsAnswered(true);
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (questionIndex < totalQuestions - 1) {
      nextQuestion();
    } else {
      // Show results
      router.push(`/training/${code}/results`);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (questionsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            ← Retour
          </Button>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {questionIndex + 1} / {totalQuestions}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 flex flex-col">
        {currentQuestion && (
          <>
            {/* Question Card */}
            <QuestionCard
              questionNumber={questionIndex + 1}
              totalQuestions={totalQuestions}
              enonce={currentQuestion.enonce}
              signalisation={currentQuestion.signalisation_visible}
              accuracy={calculateAccuracy()}
              correctCount={correctAnswers}
              incorrectCount={incorrectAnswers}
            />

            {/* Answer Options */}
            <div className="my-8 space-y-3">
              {currentQuestion.choices.map((choice: any, idx: number) => {
                const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                const letterLabel = letters[choice.order - 1] || letters[idx];
                const answerResult = answers.get(currentQuestion.id);
                const isSelectingThis = selectedAnswer === choice.id;
                const isCorrectChoice =
                  isAnswered && currentQuestion.reponses_correctes.includes(letterLabel);

                return (
                  <AnswerChoice
                    key={choice.id}
                    id={choice.id}
                    text={choice.text}
                    letter={letterLabel}
                    isSelected={isSelectingThis}
                    isAnswered={isAnswered}
                    isCorrect={isSelectingThis && isCorrectChoice}
                    onClick={() => handleSelectAnswer(choice.id)}
                  />
                );
              })}
            </div>

            {/* Feedback */}
            {showFeedback && (
              <FeedbackCard
                isCorrect={isAnswered}
                explanation={currentQuestion.explication}
                correctAnswers={currentQuestion.reponses_correctes}
                xpEarned={isAnswered ? 10 : 0}
              />
            )}

            {/* Spacer for sticky buttons */}
            <div className="flex-1" />
          </>
        )}
      </main>

      {/* Action Buttons (Sticky) */}
      <ActionButtons
        onPrevious={previousQuestion}
        onSubmit={!isAnswered ? handleSubmitAnswer : undefined}
        onNext={handleNextQuestion}
        isPreviousDisabled={questionIndex === 0}
        isAnswered={isAnswered}
        selectedAnswer={selectedAnswer}
        isLastQuestion={questionIndex === totalQuestions - 1}
      />
    </div>
  );
}
