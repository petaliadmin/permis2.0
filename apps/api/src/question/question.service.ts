import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        choices: {
          orderBy: { order: 'asc' },
        },
        category: {
          select: {
            id: true,
            label: true,
            couleur: true,
            icone: true,
          },
        },
        series: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async findByCategory(categoryId: string, skip = 0, take = 10) {
    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where: { categoryId },
        skip,
        take,
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
      }),
      this.prisma.question.count({ where: { categoryId } }),
    ]);

    return {
      data: questions,
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }

  async getRandomQuestions(categoryId?: string, limit = 10) {
    const questions = await this.prisma.question.findMany({
      where: categoryId ? { categoryId } : {},
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
      skip: Math.floor(Math.random() * Math.max(0, 75 - limit)),
    });

    return questions;
  }

  async getQuestionStats(questionId: string) {
    const question = await this.findById(questionId);

    const totalAttempts = await this.prisma.examQuestion.count({
      where: { questionId },
    });

    const correctAttempts = await this.prisma.examQuestion.count({
      where: {
        questionId,
        isCorrect: true,
      },
    });

    const successRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

    const avgTimeSpent =
      totalAttempts > 0
        ? Math.round(
            (
              await this.prisma.examQuestion.aggregate({
                where: { questionId },
                _avg: { timeSpent: true },
              })
            )._avg.timeSpent || 0
          )
        : 0;

    return {
      question,
      stats: {
        totalAttempts,
        correctAttempts,
        successRate: Math.round(successRate),
        avgTimeSpent,
      },
    };
  }

  async toggleFavoriteQuestion(questionId: string, userId: string) {
    await this.findById(questionId);

    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_lessonId_questionId: {
          userId,
          lessonId: null as any as any,
          questionId,
        },
      },
    });

    if (existing) {
      await this.prisma.favorite.delete({
        where: {
          userId_lessonId_questionId: {
            userId,
            lessonId: null as any,
            questionId,
          },
        },
      });
      return { isFavorite: false };
    } else {
      await this.prisma.favorite.create({
        data: {
          userId,
          questionId,
        },
      });
      return { isFavorite: true };
    }
  }

  async getFavoriteQuestions(userId: string, skip = 0, take = 10) {
    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: {
          userId,
          questionId: { not: null },
        },
        skip,
        take,
        include: {
          question: {
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
          },
        },
      }),
      this.prisma.favorite.count({
        where: {
          userId,
          questionId: { not: null },
        },
      }),
    ]);

    return {
      data: favorites.map((fav) => fav.question),
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }

  /**
   * Question bank for the thematic Quiz mode. Returns every QUIZ-series question
   * whose category label is in `labels`, shaped exactly like the web player expects.
   * Scoped to the "QUIZ" series so exam-series questions (which share the same
   * global Category records) don't leak into the quiz.
   */
  async getQuizBank(labels: string[]) {
    const quizSeries = await this.prisma.series.findUnique({ where: { code: 'QUIZ' } });
    const questions = await this.prisma.question.findMany({
      where: {
        serieId: quizSeries?.id,
        ...(labels.length > 0 ? { category: { label: { in: labels } } } : {}),
      },
      include: {
        choices: { orderBy: { order: 'asc' } },
        category: { select: { label: true } },
      },
      orderBy: [{ categoryId: 'asc' }, { numero: 'asc' }],
    });

    return questions.map((q) => ({
      id: q.id,
      categorie: q.category.label,
      enonce: q.enonce,
      options: q.choices.map((c) => c.text),
      bonneReponse: q.reponses_correctes[0] ?? '',
      explication: q.explication,
      ...(q.image ? { image: q.image } : {}),
      ...(q.signalisation_visible ? { signalisation_visible: q.signalisation_visible } : {}),
    }));
  }
}
