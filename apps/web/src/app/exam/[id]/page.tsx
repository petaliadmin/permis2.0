'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useExamStore } from '@/store/examStore';
import { ExamQuestionScreen, LoadingSpinner } from '@/components/ExamComponents';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ExamQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const examId = Array.isArray(params.id) ? params.id[0] : params.id;
  const questions = useExamStore((state) => state.questions);
  const currentQuestionIndex = useExamStore((state) => state.currentQuestionIndex);
  const timeRemaining = useExamStore((state) => state.timeRemaining);
  const timeTotal = useExamStore((state) => state.timeTotal);
  const answers = useExamStore((state) => state.answers);
  const isTimeUp = useExamStore((state) => state.isTimeUp);
  const isSubmitting = useExamStore((state) => state.isSubmitting);
  const examStatus = useExamStore((state) => state.examStatus);

  const submitAnswer = useExamStore((state) => state.submitAnswer);
  const nextQuestion = useExamStore((state) => state.nextQuestion);
  const updateTimeRemaining = useExamStore((state) => state.updateTimeRemaining);
  const completeExam = useExamStore((state) => state.completeExam);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [timerCleanup, setTimerCleanup] = useState<(() => void) | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  // Initialize exam if not started
  useEffect(() => {
    if (examStatus === 'idle') {
      router.push('/exam');
    }
  }, [examStatus, router]);

  // Setup timer
  useEffect(() => {
    if (examStatus !== 'in_progress') return;

    const cleanup = useExamStore.getState().startTimer();
    setTimerCleanup(() => cleanup);

    return () => {
      cleanup();
    };
  }, [examStatus]);

  // Auto-redirect when time is up
  useEffect(() => {
    if (isTimeUp && examStatus === 'in_progress') {
      completeExam().then((result) => {
        if (result) {
          router.push(`/exam/${examId}/results`);
        }
      });
    }
  }, [isTimeUp, examStatus, examId, completeExam, router]);

  // Reset answer state when question changes
  useEffect(() => {
    const answeredQuestion = answers.get(currentQuestion?.id || '');
    setSelectedAnswer(answeredQuestion || null);
    setIsAnswered(!!answeredQuestion);
    setQuestionStartTime(Date.now());
  }, [currentQuestion, answers]);

  // Check if exam is not loaded
  if (!isAuthenticated) {
    return null;
  }

  if (examStatus === 'idle' || examStatus === 'starting' || questions.length === 0) {
    return <LoadingSpinner />;
  }

  if (examStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Une erreur s'est produite lors du chargement de l'examen.
          </p>
          <button
            onClick={() => router.push('/exam')}
            className="text-primary hover:underline"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <LoadingSpinner />;
  }

  const handleSelectAnswer = (choiceId: string) => {
    if (!isAnswered) {
      setSelectedAnswer(choiceId);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) return;

    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    await submitAnswer(currentQuestion.id, selectedAnswer, timeSpent);
    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      nextQuestion();
    } else {
      // Complete exam
      completeExam().then((result) => {
        if (result) {
          router.push(`/exam/${examId}/results`);
        }
      });
    }
  };

  return (
    <ProtectedRoute>
      <ExamQuestionScreen
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        question={currentQuestion}
        selectedAnswer={selectedAnswer}
        isAnswered={isAnswered}
        timeRemaining={timeRemaining}
        timeTotal={timeTotal}
        isSubmitting={isSubmitting}
        onSelectAnswer={handleSelectAnswer}
        onSubmitAnswer={handleSubmitAnswer}
        onNext={handleNextQuestion}
      />
    </ProtectedRoute>
  );
}
