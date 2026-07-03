import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateScore, getLevelFromXP, XP_RULES } from '@permis2.0/utils';

@Injectable()
export class SeriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.series.findMany({
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  async findById(id: string) {
    const series = await this.prisma.series.findUnique({
      where: { id },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!series) {
      throw new NotFoundException('Series not found');
    }

    return series;
  }

  async getSeriesByCode(code: string) {
    const series = await this.prisma.series.findUnique({
      where: { code },
      include: {
        questions: {
          include: {
            choices: {
              orderBy: { order: 'asc' },
            },
          },
        },
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!series) {
      throw new NotFoundException(`Series ${code} not found`);
    }

    return series;
  }

  async getUserSeriesProgress(userId: string, seriesId: string) {
    const series = await this.findById(seriesId);

    const progress = await this.prisma.progress.findUnique({
      where: {
        userId_serieId: { userId, serieId: seriesId },
      },
    });

    const userAnswers = await this.prisma.examQuestion.findMany({
      where: {
        exam: { userId },
        question: { serieId: seriesId },
      },
    });

    const correctAnswers = userAnswers.filter((a) => a.isCorrect).length;
    const accuracy =
      userAnswers.length > 0 ? (correctAnswers / userAnswers.length) * 100 : 0;

    return {
      series,
      progress: {
        totalAnswered: userAnswers.length,
        correctAnswers,
        accuracy: Math.round(accuracy),
      },
    };
  }

  async submitAnswer(userId: string, questionId: string, userAnswer: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        series: true,
        category: true,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Check if answer is correct
    const isCorrect = question.reponses_correctes.includes(userAnswer);

    // Award XP and update progress atomically
    await this.prisma.$transaction(async (tx) => {
      // Award XP if correct
      if (isCorrect) {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (user) {
          const newXP = user.xp + XP_RULES.correctAnswer;
          const newLevel = this.calculateLevel(newXP);

          await tx.user.update({
            where: { id: userId },
            data: { xp: newXP, level: newLevel },
          });
        }
      }

      // Update or create progress
      const progress = await tx.progress.findUnique({
        where: {
          userId_serieId: { userId, serieId: question.serieId },
        },
      });

      if (progress) {
        const newCorrect = isCorrect ? progress.correctAnswers + 1 : progress.correctAnswers;
        const newTotal = progress.totalQuestions + 1;
        const newAccuracy = (newCorrect / newTotal) * 100;

        await tx.progress.update({
          where: { id: progress.id },
          data: {
            correctAnswers: newCorrect,
            totalQuestions: newTotal,
            accuracy: newAccuracy,
          },
        });
      } else {
        await tx.progress.create({
          data: {
            userId,
            serieId: question.serieId,
            correctAnswers: isCorrect ? 1 : 0,
            totalQuestions: 1,
            accuracy: isCorrect ? 100 : 0,
          },
        });
      }
    });

    return {
      isCorrect,
      explanation: question.explication,
      correctAnswers: question.reponses_correctes,
      xpEarned: isCorrect ? XP_RULES.correctAnswer : 0,
    };
  }

  async getQuestionsBySeriesId(seriesId: string, limit?: number) {
    const questions = await this.prisma.question.findMany({
      where: { serieId: seriesId },
      include: {
        choices: {
          orderBy: { order: 'asc' },
        },
        category: {
          select: {
            id: true,
            label: true,
            couleur: true,
          },
        },
      },
      take: limit,
    });

    return questions;
  }

  private calculateLevel(xp: number): string {
    if (xp >= 600) return 'Expert';
    if (xp >= 300) return 'Confirmé';
    if (xp >= 100) return 'Intermédiaire';
    return 'Débutant';
  }
}
