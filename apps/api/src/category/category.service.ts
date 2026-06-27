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
    const categories = await this.prisma.category.findMany({
      skip,
      take,
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    const progress = await Promise.all(
      categories.map(async (category) => {
        // Get user's correct answers for this category
        const correctAnswers = await this.prisma.examQuestion.count({
          where: {
            question: {
              categoryId: category.id,
            },
            isCorrect: true,
            exam: {
              userId,
            },
          },
        });

        const totalAnswered = await this.prisma.examQuestion.count({
          where: {
            question: {
              categoryId: category.id,
            },
            exam: {
              userId,
            },
          },
        });

        const accuracy = totalAnswered > 0 ? (correctAnswers / totalAnswered) * 100 : 0;

        return {
          id: category.id,
          label: category.label,
          description: category.description,
          couleur: category.couleur,
          icone: category.icone,
          questionCount: category._count.questions,
          correctAnswers,
          totalAnswered,
          accuracy: Math.round(accuracy),
        };
      })
    );

    const total = await this.prisma.category.count();

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
