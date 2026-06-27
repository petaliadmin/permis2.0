import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UserStatistics {
  userId: string;
  totalTests: number;
  averageScore: number;
  bestScore: number;
  overallAccuracy: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalIncorrectAnswers: number;
  timeSpentTraining: number; // seconds
  currentLevel: string;
  totalXP: number;
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  correctAnswers: number;
  totalAnswers: number;
  successRate: number;
  averageTimePerQuestion: number;
}

export interface DailyActivity {
  date: Date;
  questionsAnswered: number;
  correctAnswers: number;
  testsCompleted: number;
  xpEarned: number;
}

export interface ProgressOverTime {
  date: Date;
  totalCorrect: number;
  totalAnswered: number;
  accuracy: number;
  cumulativeXP: number;
}

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getUserStatistics(userId: string): Promise<UserStatistics> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        userId,
        totalTests: 0,
        averageScore: 0,
        bestScore: 0,
        overallAccuracy: 0,
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        totalIncorrectAnswers: 0,
        timeSpentTraining: 0,
        currentLevel: 'Débutant',
        totalXP: 0,
      };
    }

    // Get exam results
    const exams = await this.prisma.examResult.findMany({
      where: { userId },
    });

    const totalTests = exams.length;
    const averageScore = exams.length > 0
      ? exams.reduce((sum, e) => sum + e.percentage, 0) / exams.length
      : 0;
    const bestScore = exams.length > 0 ? Math.max(...exams.map((e) => e.percentage)) : 0;

    // Get all answers (from exams)
    const allAnswers = await this.prisma.examQuestion.findMany({
      where: {
        exam: { userId },
      },
    });

    const totalQuestionsAnswered = allAnswers.length;
    const totalCorrectAnswers = allAnswers.filter((a) => a.isCorrect).length;
    const totalIncorrectAnswers = totalQuestionsAnswered - totalCorrectAnswers;
    const overallAccuracy = totalQuestionsAnswered > 0
      ? (totalCorrectAnswers / totalQuestionsAnswered) * 100
      : 0;

    // Calculate time spent
    const timeSpentTraining = allAnswers.reduce((sum, a) => sum + a.timeSpent, 0);

    return {
      userId,
      totalTests,
      averageScore: Math.round(averageScore * 100) / 100,
      bestScore,
      overallAccuracy: Math.round(overallAccuracy * 100) / 100,
      totalQuestionsAnswered,
      totalCorrectAnswers,
      totalIncorrectAnswers,
      timeSpentTraining,
      currentLevel: user.level,
      totalXP: user.xp,
    };
  }

  async getCategoryStatistics(userId: string): Promise<CategoryStats[]> {
    const categories = await this.prisma.category.findMany();

    const stats: CategoryStats[] = [];

    for (const category of categories) {
      const answers = await this.prisma.examQuestion.findMany({
        where: {
          exam: { userId },
          question: { categoryId: category.id },
        },
      });

      if (answers.length === 0) continue;

      const correctAnswers = answers.filter((a) => a.isCorrect).length;
      const totalAnswers = answers.length;
      const successRate = (correctAnswers / totalAnswers) * 100;
      const averageTimePerQuestion = answers.length > 0
        ? answers.reduce((sum, a) => sum + a.timeSpent, 0) / answers.length
        : 0;

      stats.push({
        categoryId: category.id,
        categoryName: category.label,
        correctAnswers,
        totalAnswers,
        successRate: Math.round(successRate * 100) / 100,
        averageTimePerQuestion: Math.round(averageTimePerQuestion),
      });
    }

    return stats.sort((a, b) => b.successRate - a.successRate);
  }

  async getProgressOverTime(userId: string, days = 30): Promise<ProgressOverTime[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const exams = await this.prisma.examResult.findMany({
      where: {
        userId,
        completedAt: {
          gte: startDate,
        },
      },
      orderBy: { completedAt: 'asc' },
    });

    const progressMap = new Map<string, ProgressOverTime>();
    let cumulativeXP = 0;

    for (const exam of exams) {
      const date = new Date(exam.completedAt);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];

      if (!progressMap.has(dateStr)) {
        progressMap.set(dateStr, {
          date,
          totalCorrect: 0,
          totalAnswered: 0,
          accuracy: 0,
          cumulativeXP,
        });
      }

      const existing = progressMap.get(dateStr)!;
      existing.totalCorrect += exam.score;
      existing.totalAnswered += 40; // Assuming 40 questions per exam
      existing.accuracy = (existing.totalCorrect / existing.totalAnswered) * 100;

      cumulativeXP += exam.score * 10; // Assuming 10 XP per correct answer
      existing.cumulativeXP = cumulativeXP;
    }

    return Array.from(progressMap.values()).sort((a, b) =>
      a.date.getTime() - b.date.getTime()
    );
  }

  async getDailyActivity(userId: string, days = 30): Promise<DailyActivity[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const exams = await this.prisma.examResult.findMany({
      where: {
        userId,
        completedAt: {
          gte: startDate,
        },
      },
    });

    const activityMap = new Map<string, DailyActivity>();

    for (const exam of exams) {
      const date = new Date(exam.completedAt);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];

      if (!activityMap.has(dateStr)) {
        activityMap.set(dateStr, {
          date,
          questionsAnswered: 0,
          correctAnswers: 0,
          testsCompleted: 0,
          xpEarned: 0,
        });
      }

      const activity = activityMap.get(dateStr)!;
      activity.questionsAnswered += 40;
      activity.correctAnswers += exam.score;
      activity.testsCompleted += 1;
      activity.xpEarned += exam.score * 10;
    }

    return Array.from(activityMap.values()).sort((a, b) =>
      a.date.getTime() - b.date.getTime()
    );
  }

  async getWeakAreas(userId: string, limit = 5): Promise<CategoryStats[]> {
    const stats = await this.getCategoryStatistics(userId);
    return stats.sort((a, b) => a.successRate - b.successRate).slice(0, limit);
  }

  async getStrongAreas(userId: string, limit = 5): Promise<CategoryStats[]> {
    const stats = await this.getCategoryStatistics(userId);
    return stats
      .filter((s) => s.totalAnswers >= 5) // Only categories with enough data
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, limit);
  }

  async getStudyStreak(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastStudyDate?: Date;
  }> {
    const streak = await this.prisma.dailyStreak.findUnique({
      where: { userId },
    });

    if (!streak) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastStudyDate: streak.lastActivityDate || undefined,
    };
  }

  async getComparisonStats(userId: string): Promise<{
    userStats: UserStatistics;
    globalAverage: {
      averageScore: number;
      averageAccuracy: number;
      averageTimePerQuestion: number;
    };
    userPercentile: number;
  }> {
    const userStats = await this.getUserStatistics(userId);

    // Get global statistics
    const allExams = await this.prisma.examResult.findMany();
    const globalAverageScore = allExams.length > 0
      ? allExams.reduce((sum, e) => sum + e.percentage, 0) / allExams.length
      : 0;

    const allAnswers = await this.prisma.examQuestion.findMany();
    const globalAccuracy = allAnswers.length > 0
      ? (allAnswers.filter((a) => a.isCorrect).length / allAnswers.length) * 100
      : 0;

    const globalAverageTime = allAnswers.length > 0
      ? allAnswers.reduce((sum, a) => sum + a.timeSpent, 0) / allAnswers.length
      : 0;

    // Calculate user percentile
    const usersWithBetterScore = await this.prisma.user.count({
      where: {
        xp: { gt: userStats.totalXP },
      },
    });

    const totalUsers = await this.prisma.user.count();
    const userPercentile = totalUsers > 0
      ? ((totalUsers - usersWithBetterScore) / totalUsers) * 100
      : 0;

    return {
      userStats,
      globalAverage: {
        averageScore: Math.round(globalAverageScore * 100) / 100,
        averageAccuracy: Math.round(globalAccuracy * 100) / 100,
        averageTimePerQuestion: Math.round(globalAverageTime),
      },
      userPercentile: Math.round(userPercentile * 100) / 100,
    };
  }

  async getRecommendations(userId: string): Promise<{
    weakAreas: CategoryStats[];
    focusAreas: string[];
    suggestions: string[];
  }> {
    const weakAreas = await this.getWeakAreas(userId, 3);
    const stats = await this.getUserStatistics(userId);

    const focusAreas: string[] = [];
    const suggestions: string[] = [];

    // Generate recommendations based on data
    for (const area of weakAreas) {
      if (area.successRate < 50) {
        focusAreas.push(area.categoryName);
        suggestions.push(
          `Concentrez-vous sur ${area.categoryName} - seulement ${Math.round(area.successRate)}% de réussite`
        );
      }
    }

    if (stats.totalTests === 0) {
      suggestions.push('Commencez par un examen blanc pour évaluer votre niveau');
    }

    if (stats.overallAccuracy < 70) {
      suggestions.push('Révisez les leçons théoriques pour améliorer vos résultats');
    }

    if (stats.totalTests > 0 && stats.averageScore < stats.bestScore - 10) {
      suggestions.push(
        'Vos derniers résultats sont en baisse - prenez une pause et révisez'
      );
    }

    return {
      weakAreas,
      focusAreas,
      suggestions,
    };
  }
}
