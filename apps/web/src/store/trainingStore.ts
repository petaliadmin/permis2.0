import { create } from 'zustand';
import type { Series, Question } from '@permis2.0/types';

export interface AnswerResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  explanation: string;
  correctAnswers: string[];
  timeSpent: number;
  xpEarned: number;
  categoryId?: string;
}

export interface SeriesProgress {
  seriesCode: string;
  totalAttempts: number;
  bestScore: number;
  lastAttemptDate?: Date;
  categoryAccuracy: Record<string, number>;
}

interface TrainingState {
  // Series
  series: Series[];
  selectedSeries: Series | null;
  seriesLoading: boolean;

  // Questions
  questions: Question[];
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  questionsLoading: boolean;

  // Session tracking
  sessionStartTime: number | null;
  sessionTimeSpent: number;

  // Answer tracking
  answers: Map<string, string>;
  answerResults: Map<string, AnswerResult>;
  correctAnswers: number;
  incorrectAnswers: number;
  results: AnswerResult[];
  categoryStats: Record<string, { correct: number; total: number }>;

  // Methods
  fetchAllSeries: () => Promise<void>;
  loadSeriesByCode: (code: string) => Promise<void>;
  loadSeriesQuestions: (seriesId: string) => Promise<void>;
  submitAnswer: (questionId: string, answer: string) => Promise<void>;
  nextQuestion: () => void;
  previousQuestion: () => void;
  resetSeries: () => void;
  calculateAccuracy: () => number;
  getSessionStats: () => { totalTime: number; avgTimePerQuestion: number };
  getCategoryStats: () => Record<string, number>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useTrainingStore = create<TrainingState>((set, get) => ({
  series: [],
  selectedSeries: null,
  seriesLoading: false,

  questions: [],
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  questionsLoading: false,

  sessionStartTime: null,
  sessionTimeSpent: 0,

  answers: new Map(),
  answerResults: new Map(),
  correctAnswers: 0,
  incorrectAnswers: 0,
  results: [],
  categoryStats: {},

  fetchAllSeries: async () => {
    set({ seriesLoading: true });
    try {
      const response = await fetch(`${API_URL}/series`);
      if (!response.ok) throw new Error('Failed to fetch series');
      const data = await response.json();
      set({ series: data });
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      set({ seriesLoading: false });
    }
  },

  loadSeriesByCode: async (code: string) => {
    set({ questionsLoading: true });
    try {
      const response = await fetch(`${API_URL}/series`);
      if (!response.ok) throw new Error('Failed to fetch series');
      const seriesData = await response.json();

      const selected = seriesData.find((s: any) => s.code === code);
      if (!selected) throw new Error('Series not found');

      set({ selectedSeries: selected });

      const questionsResponse = await fetch(`${API_URL}/series/${selected.id}/questions`);
      if (!questionsResponse.ok) throw new Error('Failed to load questions');
      const questions = await questionsResponse.json();

      set({
        questions,
        totalQuestions: questions.length,
        questionIndex: 0,
        currentQuestion: questions[0] || null,
        sessionStartTime: Date.now(),
        sessionTimeSpent: 0,
        answers: new Map(),
        answerResults: new Map(),
        correctAnswers: 0,
        incorrectAnswers: 0,
        results: [],
        categoryStats: {},
      });
    } catch (error) {
      console.error('Error loading series:', error);
    } finally {
      set({ questionsLoading: false });
    }
  },

  loadSeriesQuestions: async (seriesId: string) => {
    set({ questionsLoading: true });
    try {
      const response = await fetch(`${API_URL}/series/${seriesId}/questions`);
      if (!response.ok) throw new Error('Failed to load questions');
      const questions = await response.json();

      set({
        questions,
        totalQuestions: questions.length,
        questionIndex: 0,
        currentQuestion: questions[0] || null,
        sessionStartTime: Date.now(),
      });
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      set({ questionsLoading: false });
    }
  },

  submitAnswer: async (questionId: string, answer: string) => {
    const state = get();
    const token = localStorage.getItem('auth-store')
      ? JSON.parse(localStorage.getItem('auth-store') || '{}').state?.token
      : null;

    if (!token || !state.currentQuestion) {
      console.error('Not authenticated or no current question');
      return;
    }

    try {
      const answerStartTime = Date.now();
      const response = await fetch(`${API_URL}/series/${questionId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answer }),
      });

      if (!response.ok) throw new Error('Failed to submit answer');
      const result = await response.json();

      const timeSpent = Math.round((Date.now() - answerStartTime) / 1000);
      const answerResult: AnswerResult = {
        questionId,
        userAnswer: answer,
        isCorrect: result.isCorrect,
        explanation: result.explanation,
        correctAnswers: result.correctAnswers,
        timeSpent,
        xpEarned: result.xpEarned || 0,
        categoryId: state.currentQuestion.categoryId,
      };

      const newAnswers = new Map(state.answers);
      newAnswers.set(questionId, answer);

      const newAnswerResults = new Map(state.answerResults);
      newAnswerResults.set(questionId, answerResult);

      const newCorrect = state.correctAnswers + (result.isCorrect ? 1 : 0);
      const newIncorrect = state.incorrectAnswers + (result.isCorrect ? 0 : 1);

      const newResults = [...state.results, answerResult];

      // Update category stats
      const newCategoryStats = { ...state.categoryStats };
      const catId = state.currentQuestion.categoryId || 'unknown';
      if (!newCategoryStats[catId]) {
        newCategoryStats[catId] = { correct: 0, total: 0 };
      }
      newCategoryStats[catId].total += 1;
      if (result.isCorrect) {
        newCategoryStats[catId].correct += 1;
      }

      set({
        answers: newAnswers,
        answerResults: newAnswerResults,
        correctAnswers: newCorrect,
        incorrectAnswers: newIncorrect,
        results: newResults,
        categoryStats: newCategoryStats,
        sessionTimeSpent: Date.now() - (state.sessionStartTime || Date.now()),
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  },

  nextQuestion: () => {
    const state = get();
    if (state.questionIndex < state.totalQuestions - 1) {
      set({
        questionIndex: state.questionIndex + 1,
        currentQuestion: state.questions[state.questionIndex + 1] || null,
      });
    }
  },

  previousQuestion: () => {
    const state = get();
    if (state.questionIndex > 0) {
      set({
        questionIndex: state.questionIndex - 1,
        currentQuestion: state.questions[state.questionIndex - 1] || null,
      });
    }
  },

  resetSeries: () => {
    set({
      questions: [],
      currentQuestion: null,
      questionIndex: 0,
      totalQuestions: 0,
      sessionStartTime: null,
      sessionTimeSpent: 0,
      answers: new Map(),
      answerResults: new Map(),
      correctAnswers: 0,
      incorrectAnswers: 0,
      results: [],
      categoryStats: {},
    });
  },

  calculateAccuracy: () => {
    const state = get();
    const total = state.correctAnswers + state.incorrectAnswers;
    return total > 0 ? Math.round((state.correctAnswers / total) * 100) : 0;
  },

  getSessionStats: () => {
    const state = get();
    const totalTime = Math.round((Date.now() - (state.sessionStartTime || Date.now())) / 1000);
    const avgTimePerQuestion = state.results.length > 0
      ? Math.round(state.results.reduce((sum, r) => sum + r.timeSpent, 0) / state.results.length)
      : 0;
    return { totalTime, avgTimePerQuestion };
  },

  getCategoryStats: () => {
    const state = get();
    const stats: Record<string, number> = {};
    Object.entries(state.categoryStats).forEach(([catId, { correct, total }]) => {
      stats[catId] = total > 0 ? Math.round((correct / total) * 100) : 0;
    });
    return stats;
  },
}));
