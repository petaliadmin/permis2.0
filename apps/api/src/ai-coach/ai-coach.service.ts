import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface WeakCategory {
  categoryId: string;
  categoryName: string;
  successRate: number;
  totalAttempts: number;
}

export interface LearningInsight {
  type: 'strength' | 'weakness' | 'improvement' | 'trend';
  title: string;
  description: string;
  icon: string;
  actionable: boolean;
}

export interface PersonalizedQuiz {
  id: string;
  title: string;
  description: string;
  targetCategories: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // minutes
  questionCount: number;
}

export interface RecommendationPath {
  step: number;
  title: string;
  description: string;
  action: 'learn' | 'practice' | 'test';
  target: string; // lesson ID, category ID, or quiz ID
  estimatedTime: number; // minutes
  priority: 'high' | 'medium' | 'low';
}

export interface CoachAnalysis {
  insights: LearningInsight[];
  recommendations: RecommendationPath[];
  personalizedQuiz: PersonalizedQuiz;
  nextMilestones: string[];
  motivationalMessage: string;
}

@Injectable()
export class AiCoachService {
  constructor(private prisma: PrismaService) {}

  async generateAnalysis(userId: string): Promise<CoachAnalysis> {
    // Get user statistics
    const stats = await this.getUserStats(userId);
    const weakAreas = await this.getWeakAreas(userId);
    const strongAreas = await this.getStrongAreas(userId);
    const recentProgress = await this.getRecentProgress(userId);

    // Generate insights
    const insights = this.generateInsights(stats, weakAreas, strongAreas, recentProgress);

    // Generate recommendations
    const recommendations = this.generateRecommendations(weakAreas, strongAreas, stats);

    // Create personalized quiz
    const quiz = this.createPersonalizedQuiz(weakAreas, stats);

    // Get next milestones
    const milestones = this.getNextMilestones(stats);

    // Generate motivational message
    const message = this.generateMotivationalMessage(stats, recentProgress);

    return {
      insights,
      recommendations,
      personalizedQuiz: quiz,
      nextMilestones: milestones,
      motivationalMessage: message,
    };
  }

  private async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const exams = await this.prisma.examResult.findMany({
      where: { userId },
    });

    const totalCorrect = await this.prisma.examQuestion.count({
      where: {
        exam: { userId },
        isCorrect: true,
      },
    });

    const totalAnswered = await this.prisma.examQuestion.count({
      where: {
        exam: { userId },
      },
    });

    return {
      totalTests: exams.length,
      averageScore:
        exams.length > 0 ? exams.reduce((sum, e) => sum + e.percentage, 0) / exams.length : 0,
      bestScore: exams.length > 0 ? Math.max(...exams.map((e) => e.percentage)) : 0,
      overallAccuracy: totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0,
      totalXP: user?.xp || 0,
      level: user?.level || 'Débutant',
    };
  }

  private async getWeakAreas(userId: string): Promise<WeakCategory[]> {
    const categories = await this.prisma.category.findMany();
    const areas: WeakCategory[] = [];

    for (const category of categories) {
      const answers = await this.prisma.examQuestion.findMany({
        where: {
          exam: { userId },
          question: { categoryId: category.id },
        },
      });

      if (answers.length === 0) continue;

      const correct = answers.filter((a) => a.isCorrect).length;
      const successRate = (correct / answers.length) * 100;

      if (successRate < 70) {
        areas.push({
          categoryId: category.id,
          categoryName: category.label,
          successRate: Math.round(successRate * 100) / 100,
          totalAttempts: answers.length,
        });
      }
    }

    return areas.sort((a, b) => a.successRate - b.successRate);
  }

  private async getStrongAreas(userId: string): Promise<WeakCategory[]> {
    const categories = await this.prisma.category.findMany();
    const areas: WeakCategory[] = [];

    for (const category of categories) {
      const answers = await this.prisma.examQuestion.findMany({
        where: {
          exam: { userId },
          question: { categoryId: category.id },
        },
      });

      if (answers.length < 5) continue; // Minimum attempts required

      const correct = answers.filter((a) => a.isCorrect).length;
      const successRate = (correct / answers.length) * 100;

      if (successRate >= 80) {
        areas.push({
          categoryId: category.id,
          categoryName: category.label,
          successRate: Math.round(successRate * 100) / 100,
          totalAttempts: answers.length,
        });
      }
    }

    return areas.sort((a, b) => b.successRate - a.successRate);
  }

  private async getRecentProgress(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentExams = await this.prisma.examResult.findMany({
      where: {
        userId,
        completedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    });

    if (recentExams.length === 0) {
      return { trend: 'stable', improvement: 0 };
    }

    const oldestScore = recentExams[recentExams.length - 1].percentage;
    const newestScore = recentExams[0].percentage;
    const improvement = newestScore - oldestScore;

    const trend = improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable';

    return { trend, improvement: Math.round(improvement * 100) / 100 };
  }

  private generateInsights(
    stats: any,
    weakAreas: WeakCategory[],
    strongAreas: WeakCategory[],
    recentProgress: any
  ): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Strength insight
    if (strongAreas.length > 0) {
      insights.push({
        type: 'strength',
        title: `Vous excellez en ${strongAreas[0].categoryName}`,
        description: `Vous avez ${Math.round(strongAreas[0].successRate)}% de réussite dans cette catégorie. Continuez ainsi!`,
        icon: '⭐',
        actionable: false,
      });
    }

    // Weakness insight
    if (weakAreas.length > 0) {
      insights.push({
        type: 'weakness',
        title: `Focus sur ${weakAreas[0].categoryName}`,
        description: `Seulement ${Math.round(weakAreas[0].successRate)}% de réussite. C'est votre point faible.`,
        icon: '⚠️',
        actionable: true,
      });
    }

    // Improvement trend
    if (recentProgress.trend === 'improving') {
      insights.push({
        type: 'improvement',
        title: 'Progression visible',
        description: `Votre score a augmenté de ${recentProgress.improvement}% en 30 jours. Excellent!`,
        icon: '📈',
        actionable: false,
      });
    } else if (recentProgress.trend === 'declining') {
      insights.push({
        type: 'trend',
        title: 'Attention: Baisse de performance',
        description: `Votre score a baissé de ${Math.abs(recentProgress.improvement)}%. Prenez une pause ou révisez.`,
        icon: '📉',
        actionable: true,
      });
    }

    // Overall level insight
    if (stats.overallAccuracy >= 80) {
      insights.push({
        type: 'strength',
        title: 'Vous êtes bien préparé!',
        description: `${Math.round(stats.overallAccuracy)}% de précision globale. Vous êtes prêt pour l'examen!`,
        icon: '🎯',
        actionable: false,
      });
    }

    return insights;
  }

  private generateRecommendations(
    weakAreas: WeakCategory[],
    strongAreas: WeakCategory[],
    stats: any
  ): RecommendationPath[] {
    const recommendations: RecommendationPath[] = [];
    let step = 1;

    // If no tests completed, suggest starting with first test
    if (stats.totalTests === 0) {
      recommendations.push({
        step: step++,
        title: 'Commencer avec un examen blanc',
        description: 'Découvrez votre niveau actuel avec un examen blanc complet.',
        action: 'test',
        target: 'exam',
        estimatedTime: 45,
        priority: 'high',
      });
    }

    // Focus on weak areas
    if (weakAreas.length > 0) {
      for (let i = 0; i < Math.min(2, weakAreas.length); i++) {
        const area = weakAreas[i];
        recommendations.push({
          step: step++,
          title: `Améliorer ${area.categoryName}`,
          description: `Passez de ${Math.round(area.successRate)}% à 80%+ en cette catégorie.`,
          action: 'practice',
          target: area.categoryId,
          estimatedTime: 30,
          priority: i === 0 ? 'high' : 'medium',
        });
      }
    }

    // Review lessons
    if (weakAreas.length > 0) {
      recommendations.push({
        step: step++,
        title: 'Revoir les théories',
        description: 'Lisez les fiches théoriques des domaines faibles.',
        action: 'learn',
        target: 'lessons',
        estimatedTime: 60,
        priority: 'high',
      });
    }

    // Practice with quiz
    recommendations.push({
      step: step++,
      title: 'Quiz personnalisé',
      description: 'Testez-vous avec des questions ciblées.',
      action: 'practice',
      target: 'quiz',
      estimatedTime: 20,
      priority: 'medium',
    });

    // Final exam
    recommendations.push({
      step: step++,
      title: 'Examen blanc final',
      description: 'Validez votre progression avec un nouvel examen blanc.',
      action: 'test',
      target: 'exam',
      estimatedTime: 45,
      priority: 'high',
    });

    return recommendations;
  }

  private createPersonalizedQuiz(weakAreas: WeakCategory[], stats: any): PersonalizedQuiz {
    const targetCategories = weakAreas.slice(0, 3).map((a) => a.categoryId);

    const difficulty =
      stats.overallAccuracy < 50 ? 'easy' : stats.overallAccuracy < 70 ? 'medium' : 'hard';

    const questionCount = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20;
    const estimatedTime = Math.ceil(questionCount * 1.5); // ~1.5 min per question

    return {
      id: `quiz-${Date.now()}`,
      title: 'Quiz personnalisé',
      description: 'Questions basées sur vos points faibles',
      targetCategories: targetCategories.length > 0 ? targetCategories : [],
      difficulty,
      estimatedTime,
      questionCount,
    };
  }

  private getNextMilestones(stats: any): string[] {
    const milestones: string[] = [];

    if (stats.totalTests < 1) {
      milestones.push('Complétez votre premier examen blanc');
    }
    if (stats.overallAccuracy < 70) {
      milestones.push('Atteindre 70% de précision');
    }
    if (stats.overallAccuracy < 80) {
      milestones.push('Atteindre 80% de précision');
    }
    if (stats.totalXP < 100) {
      milestones.push('Gagner 100 XP');
    }
    if (stats.level === 'Débutant') {
      milestones.push('Atteindre le niveau Intermédiaire');
    }
    if (stats.totalTests < 5) {
      milestones.push(`Compléter ${5 - stats.totalTests} examens supplémentaires`);
    }

    return milestones.slice(0, 5);
  }

  private generateMotivationalMessage(stats: any, progress: any): string {
    const messages = {
      beginner: [
        'Vous commencez votre apprentissage - chaque question vous rapproche de votre objectif! 🎯',
        'Premiers pas vers le permis! Continuez comme ça! 💪',
        'Bienvenue! Vous avez choisi un excellent moment pour commencer! 🚀',
      ],
      improving: [
        'Votre progression est impressionnante! Vous êtes sur la bonne voie! 📈',
        'Continuez avec ce momentum - vous êtes en train de réussir! 🔥',
        "Les résultats parlent d'eux-mêmes - keep going! 💯",
      ],
      strong: [
        "Vous êtes bien préparé pour l'examen! Faites confiance à votre travail! 🏆",
        "Vous maîtrisez les sujets - c'est votre moment! ✨",
        'Excellent travail! Vous êtes prêt à réussir! 🎉',
      ],
      stable: [
        "Vous êtes constant dans votre apprentissage - c'est une force! 💎",
        "La régularité c'est la clé du succès! Continuez! 🔑",
        'Vous avancez régulièrement vers votre objectif! 🎯',
      ],
    };

    let category = 'stable';
    if (stats.totalTests === 0) category = 'beginner';
    else if (progress.trend === 'improving') category = 'improving';
    else if (stats.overallAccuracy >= 80) category = 'strong';

    const categoryMessages = messages[category as keyof typeof messages];
    return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
  }
}
