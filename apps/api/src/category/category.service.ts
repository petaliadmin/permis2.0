import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Category } from '@permis2.0/types';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(skip = 0, take = 10) {
    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        skip,
        take,
        include: {
          _count: {
            select: { questions: true, lessons: true },
          },
        },
      }),
      this.prisma.category.count(),
    ]);

    return {
      data: categories.map((cat) => ({
        ...cat,
        questionCount: cat._count.questions,
        lessonCount: cat._count.lessons,
      })),
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        lessons: {
          select: {
            id: true,
            titre: true,
            contenu: true,
          },
        },
        questions: {
          select: {
            id: true,
            numero: true,
            enonce: true,
          },
        },
        _count: {
          select: { questions: true, lessons: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      ...category,
      questionCount: category._count.questions,
      lessonCount: category._count.lessons,
    };
  }

  async getUserCategoryProgress(userId: string, skip = 0, take = 10) {
    const [categories, total, allExamQuestions] = await Promise.all([
      this.prisma.category.findMany({
        skip,
        take,
        include: {
          _count: {
            select: { questions: true },
          },
        },
      }),
      this.prisma.category.count(),
      this.prisma.examQuestion.findMany({
        where: { exam: { userId } },
        select: { isCorrect: true, question: { select: { categoryId: true } } },
      }),
    ]);

    // Build a map of categoryId -> { correct, total } in memory
    const progressMap = new Map<string, { correct: number; total: number }>();
    for (const eq of allExamQuestions) {
      const catId = eq.question?.categoryId;
      if (!catId) continue;
      const entry = progressMap.get(catId) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (eq.isCorrect) entry.correct += 1;
      progressMap.set(catId, entry);
    }

    const progress = categories.map((category) => {
      const entry = progressMap.get(category.id) ?? { correct: 0, total: 0 };
      const accuracy = entry.total > 0 ? (entry.correct / entry.total) * 100 : 0;

      return {
        id: category.id,
        label: category.label,
        description: category.description,
        couleur: category.couleur,
        icone: category.icone,
        questionCount: category._count.questions,
        correctAnswers: entry.correct,
        totalAnswered: entry.total,
        accuracy: Math.round(accuracy),
      };
    });

    return {
      data: progress,
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }

  async search(query: string, skip = 0, take = 10) {
    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where: {
          OR: [
            { label: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take,
        include: {
          _count: {
            select: { questions: true, lessons: true },
          },
        },
      }),
      this.prisma.category.count({
        where: {
          OR: [
            { label: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      data: categories.map((cat) => ({
        ...cat,
        questionCount: cat._count.questions,
        lessonCount: cat._count.lessons,
      })),
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }
}
