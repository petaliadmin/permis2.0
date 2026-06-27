'use client';

import { create } from 'zustand';
import type { ExamQuestion, ExamResult } from '@permis2.0/types';

export interface ExamState {
  // State
  examId: string | null;
  timeRemaining: number;
  timeTotal: number;
  currentQuestionIndex: number;
  questions: ExamQuestion[];
  answers: Map<string, string>;
  isTimeUp: boolean;
  isSubmitting: boolean;
  examStatus: 'idle' | 'starting' | 'in_progress' | 'completed' | 'error';
  errorMessage: string | null;
  result: ExamResult | null;

  // Methods
  startExam: (numberOfQuestions?: number) => Promise<void>;
  submitAnswer: (questionId: string, answer: string, timeSpent: number) => Promise<void>;
  completeExam: () => Promise<ExamResult | null>;
  updateTimeRemaining: (remaining: number) => void;
  nextQuestion: () => void;
  resetExam: () => void;
  startTimer: () => () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const EXAM_DURATION = 30 * 60 * 1000; // 30 minutes

export const useExamStore = create<ExamState>((set, get) => ({
  examId: null,
  timeRemaining: EXAM_DURATION,
  timeTotal: EXAM_DURATION,
  currentQuestionIndex: 0,
  questions: [],
  answers: new Map(),
  isTimeUp: false,
  isSubmitting: false,
  examStatus: 'idle',
  errorMessage: null,
  result: null,

  startExam: async (numberOfQuestions = 40) => {
    set({ examStatus: 'starting', errorMessage: null });

    try {
      const token = localStorage.getItem('auth-store')
        ? JSON.parse(localStorage.getItem('auth-store') || '{}').state?.token
        : null;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/exams/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ numberOfQuestions }),
      });

      if (!response.ok) {
        throw new Error('Failed to start exam');
      }

      const data = await response.json();

      set({
        examId: data.examId,
        questions: data.questions,
        timeRemaining: data.duration,
        timeTotal: data.duration,
        currentQuestionIndex: 0,
        answers: new Map(),
        isTimeUp: false,
        examStatus: 'in_progress',
      });

      // Start timer
      get().startTimer();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start exam';
      set({ examStatus: 'error', errorMessage: message });
      console.error('Error starting exam:', error);
    }
  },

  submitAnswer: async (questionId: string, answer: string, timeSpent: number) => {
    const state = get();
    if (!state.examId) return;

    set({ isSubmitting: true });

    try {
      const token = localStorage.getItem('auth-store')
        ? JSON.parse(localStorage.getItem('auth-store') || '{}').state?.token
        : null;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/exams/${state.examId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionId,
          answer,
          timeSpent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const newAnswers = new Map(state.answers);
      newAnswers.set(questionId, answer);

      set({ answers: newAnswers });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit answer';
      set({ errorMessage: message });
      console.error('Error submitting answer:', error);
    } finally {
      set({ isSubmitting: false });
    }
  },

  completeExam: async () => {
    const state = get();
    if (!state.examId) return null;

    set({ isSubmitting: true, examStatus: 'completed' });

    try {
      const token = localStorage.getItem('auth-store')
        ? JSON.parse(localStorage.getItem('auth-store') || '{}').state?.token
        : null;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/exams/${state.examId}/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to complete exam');
      }

      const data = await response.json();
      const result = data.result as ExamResult;

      set({ result });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete exam';
      set({ examStatus: 'error', errorMessage: message });
      console.error('Error completing exam:', error);
      return null;
    } finally {
      set({ isSubmitting: false });
    }
  },

  updateTimeRemaining: (remaining: number) => {
    const isTimeUp = remaining <= 0;

    set({
      timeRemaining: Math.max(0, remaining),
      isTimeUp,
    });

    // Auto-submit if time is up
    if (isTimeUp && get().examStatus === 'in_progress') {
      get().completeExam();
    }
  },

  nextQuestion: () => {
    const state = get();
    if (state.currentQuestionIndex < state.questions.length - 1) {
      set({ currentQuestionIndex: state.currentQuestionIndex + 1 });
    }
  },

  resetExam: () => {
    set({
      examId: null,
      timeRemaining: EXAM_DURATION,
      timeTotal: EXAM_DURATION,
      currentQuestionIndex: 0,
      questions: [],
      answers: new Map(),
      isTimeUp: false,
      isSubmitting: false,
      examStatus: 'idle',
      errorMessage: null,
      result: null,
    });
  },

  // Helper method - called by component
  startTimer: () => {
    const initialTime = get().timeRemaining;
    let elapsedTime = 0;

    const interval = setInterval(() => {
      elapsedTime += 100; // Update every 100ms for smooth countdown
      const remaining = Math.max(0, initialTime - elapsedTime);

      get().updateTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    // Return cleanup function
    return () => clearInterval(interval);
  },
}));
