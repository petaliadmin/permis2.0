import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { XP_RULES } from '@permis2.0/utils';

interface ExamStartRequest {
  numberOfQuestions?: number; // default: 40
}

@Injectable()
export class ExamService {
  private readonly EXAM_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  private readonly DEFAULT_QUESTIONS = 40;

  constructor(private prisma: PrismaService) {}

  async startExam(userId: string, config: ExamStartRequest = {}) {
    const { numberOfQuestions = this.DEFAULT_QUESTIONS } = config;

    // Get all questions from all series
    const allQuestions = await this.prisma.question.findMany({
      include: {
        choices: {
          orderBy: { order: 'asc' },
        },
        category: {
          select: {
            id: true,
            label: true,
          },
        },
      },
    });

    if (allQuestions.length < numberOfQuestions) {
      throw new BadRequestException(
        `Not enough questions available. Need ${numberOfQuestions}, found ${allQuestions.length}`
      );
    }

    // Shuffle and select random questions
    const shuffled = this.shuffleArray(allQuestions);
    const selectedQuestions = shuffled.slice(0, numberOfQuestions);

    // Create exam record
    const exam = await this.prisma.exam.create({
      data: {
        userId,
        status: 'in_progress',
        startedAt: new Date(),
        questions: {
          create: selectedQuestions.map((q: any) => ({
            questionId: q.id,
          })),
        },
      },
      include: {
        questions: {
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
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      examId: exam.id,
      startedAt: exam.startedAt,
      duration: this.EXAM_DURATION,
      totalQuestions: selectedQuestions.length,
      questions: exam.questions.map((eq) => ({
        id: eq.question.id,
        enonce: eq.question.enonce,
        signalisation_visible: eq.question.signalisation_visible,
        choices: eq.question.choices,
        category: eq.question.category,
      })),
    };
  }

  async getExamStatus(examId: string, userId: string) {
    const exam = await this.findExamByIdAndUser(examId, userId);

    if (exam.status === 'completed') {
      return {
        examId: exam.id,
        status: 'completed',
        completedAt: exam.completedAt,
        result: await this.getExamResult(examId),
      };
    }

    if (!exam.startedAt) {
      throw new NotFoundException('Exam start time not found');
    }

    const elapsedTime = Date.now() - exam.startedAt.getTime();
    const timeRemaining = Math.max(0, this.EXAM_DURATION - elapsedTime);
    const isTimeUp = timeRemaining <= 0;

    // Auto-submit if time is up
    if (isTimeUp && exam.status !== 'completed') {
      return await this.submitExam(examId, userId);
    }

    const answeredQuestions = exam.questions.filter((q) => q.userAnswer !== null).length;

    return {
      examId: exam.id,
      status: exam.status,
      timeRemaining,
      questionsAnswered: answeredQuestions,
      totalQuestions: exam.questions.length,
    };
  }

  async submitAnswer(
    examId: string,
    userId: string,
    questionId: string,
    userAnswer: string,
    timeSpent: number = 0
  ) {
    const exam = await this.findExamByIdAndUser(examId, userId);

    if (exam.status !== 'in_progress') {
      throw new BadRequestException('Exam is not in progress');
    }

    if (!exam.startedAt) {
      throw new BadRequestException('Exam has not started');
    }

    const elapsedTime = Date.now() - exam.startedAt.getTime();
    if (elapsedTime > this.EXAM_DURATION) {
      throw new BadRequestException('Exam time has expired');
    }

    // Find and update the exam question
    const examQuestion = exam.questions.find((q) => q.questionId === questionId);
    if (!examQuestion) {
      throw new NotFoundException('Question not found in this exam');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const isCorrect = question.reponses_correctes.includes(userAnswer);

    const updatedExamQuestion = await this.prisma.examQuestion.update({
      where: { id: examQuestion.id },
      data: {
        userAnswer,
        isCorrect,
        timeSpent,
      },
    });

    return {
      isCorrect,
      explanation: question.explication,
      correctAnswers: question.reponses_correctes,
      xpEarned: isCorrect ? XP_RULES.correctAnswer : 0,
    };
  }

  async submitExam(examId: string, userId: string) {
    const exam = await this.findExamByIdAndUser(examId, userId);

    if (exam.status === 'completed') {
      return await this.getExamResult(examId);
    }

    if (!exam.startedAt) {
      throw new NotFoundException('Exam start time not found');
   }
    const totalTime = Date.now() - exam.startedAt.getTime();
    const answeredQuestions = exam.questions.filter((q) => q.userAnswer !== null);
    const correctAnswers = answeredQuestions.filter((q) => q.isCorrect).length;
    const score = answeredQuestions.length;
    const percentage = answeredQuestions.length > 0
      ? Math.round((correctAnswers / answeredQuestions.length) * 100)
      : 0;
    const passed = percentage >= 70; // 70% threshold

    // Award XP
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      const xpEarned = correctAnswers * XP_RULES.correctAnswer;
      const newXP = user.xp + xpEarned;
      const newLevel = this.calculateLevel(newXP);

      await this.prisma.user.update({
        where: { id: userId },
        data: { xp: newXP, level: newLevel },
      });
    }

    // Create exam result
    const result = await this.prisma.examResult.create({
      data: {
        examId,
        userId,
        score,
        percentage,
        passed,
        timeUsed: Math.round(totalTime / 1000), // seconds
        totalTime: Math.round(this.EXAM_DURATION / 1000), // seconds
        startedAt: exam.startedAt ?? new Date(),
        completedAt: new Date(),
      },
    });

    // Mark exam as completed
    await this.prisma.exam.update({
      where: { id: examId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    return {
      examId,
      result: {
        score,
        percentage,
        passed,
        timeUsed: Math.round(totalTime / 1000),
        xpEarned: correctAnswers * XP_RULES.correctAnswer,
        message: passed
          ? 'Felicitations! Vous avez réussi l\'examen!'
          : 'Vous avez besoin de 70% pour réussir. Réessayez!',
      },
    };
  }

  async getExamResult(examId: string) {
    const result = await this.prisma.examResult.findUnique({
      where: { examId },
      include: {
        exam: {
          include: {
            questions: {
              include: {
                question: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Exam result not found');
    }

    // Calculate category breakdown
    const categoryStats: Record<string, { correct: number; total: number }> = {};
    result.exam.questions.forEach((eq) => {
      const catId = eq.question.categoryId;
      if (!categoryStats[catId]) {
        categoryStats[catId] = { correct: 0, total: 0 };
      }
      categoryStats[catId].total += 1;
      if (eq.isCorrect) {
        categoryStats[catId].correct += 1;
      }
    });

    const categoryBreakdown = Object.entries(categoryStats).reduce(
      (acc, [catId, stats]) => {
        acc[catId] = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      examId: result.examId,
      score: result.score,
      percentage: result.percentage,
      passed: result.passed,
      timeUsed: result.timeUsed,
      totalTime: result.totalTime,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      categoryBreakdown,
      xpEarned: result.score * XP_RULES.correctAnswer, // approximation
    };
  }

  async getExamHistory(userId: string, skip = 0, take = 10) {
    const [exams, total] = await Promise.all([
      this.prisma.examResult.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.examResult.count({ where: { userId } }),
    ]);

    return {
      data: exams,
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }

  private async findExamByIdAndUser(examId: string, userId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return exam;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private calculateLevel(xp: number): string {
    if (xp >= 600) return 'Expert';
    if (xp >= 300) return 'Confirmé';
    if (xp >= 100) return 'Intermédiaire';
    return 'Débutant';
  }
}
