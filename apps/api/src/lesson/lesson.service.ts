import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LessonService {
  constructor(private prisma: PrismaService) {}

  async findAll(skip = 0, take = 10) {
    const [lessons, total] = await Promise.all([
      this.prisma.lesson.findMany({
        skip,
        take,
        include: {
          category: {
            select: {
              id: true,
              label: true,
              couleur: true,
              icone: true,
            },
          },
        },
      }),
      this.prisma.lesson.count(),
    ]);

    return {
      data: lessons,
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }

  async findById(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            label: true,
            couleur: true,
            icone: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async findByCategory(categoryId: string, skip = 0, take = 10) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const [lessons, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where: { categoryId },
        skip,
        take,
        include: {
          category: {
            select: {
              id: true,
              label: true,
              couleur: true,
              icone: true,
            },
          },
        },
      }),
      this.prisma.lesson.count({ where: { categoryId } }),
    ]);

    return {
      data: lessons,
      category,
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }

  async search(query: string, skip = 0, take = 10) {
    const [lessons, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where: {
          OR: [
            { titre: { contains: query, mode: 'insensitive' } },
            { contenu: { contains: query, mode: 'insensitive' } },
            { category: { label: { contains: query, mode: 'insensitive' } } },
          ],
        },
        skip,
        take,
        include: {
          category: {
            select: {
              id: true,
              label: true,
              couleur: true,
              icone: true,
            },
          },
        },
      }),
      this.prisma.lesson.count({
        where: {
          OR: [
            { titre: { contains: query, mode: 'insensitive' } },
            { contenu: { contains: query, mode: 'insensitive' } },
            { category: { label: { contains: query, mode: 'insensitive' } } },
          ],
        },
      }),
    ]);

    return {
      data: lessons,
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }

  async getWithFavoriteStatus(lessonId: string, userId: string) {
    const lesson = await this.findById(lessonId);

    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_lessonId_questionId: {
          userId,
          lessonId,
          questionId: null as any,
        },
      },
    });

    return {
      ...lesson,
      isFavorite: !!favorite,
    };
  }

  async toggleFavorite(lessonId: string, userId: string) {
    // Check if lesson exists
    await this.findById(lessonId);

    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_lessonId_questionId: {
          userId,
          lessonId,
          questionId: null as any,
        },
      },
    });

    if (existing) {
      await this.prisma.favorite.delete({
      where: {
        userId_lessonId_questionId: {
          userId,
          lessonId,
          questionId: null as any as any,
        },
      },
      });
      return { isFavorite: false };
    } else {
      await this.prisma.favorite.create({
        data: {
          userId,
          lessonId,
        },
      });
      return { isFavorite: true };
    }
  }

  async getFavorites(userId: string, skip = 0, take = 10) {
    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: {
          userId,
          lessonId: { not: null },
        },
        skip,
        take,
        include: {
          lesson: {
            include: {
              category: {
                select: {
                  id: true,
                  label: true,
                  couleur: true,
                  icone: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.favorite.count({
        where: {
          userId,
          lessonId: { not: null },
        },
      }),
    ]);

    return {
      data: favorites.map((fav) => fav.lesson),
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }
}
