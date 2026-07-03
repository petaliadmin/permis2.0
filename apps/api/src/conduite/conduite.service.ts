import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Conduite (practical driving) vertical — Sprint 4. Public, guest-friendly
 * endpoints that mirror the Series/Question shape so the web app can reuse the
 * shared QuizRunner. Courses can be `isDraft` (provisional content) but are
 * still served; the client surfaces a "brouillon" badge.
 */
@Injectable()
export class ConduiteService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const courses = await this.prisma.drivingCourse.findMany({
      orderBy: { ordre: 'asc' },
      include: {
        _count: { select: { questions: true } },
      },
    });

    return courses.map((course) => ({
      ...course,
      questionCount: course._count.questions,
    }));
  }

  async findBySlug(slug: string) {
    const course = await this.prisma.drivingCourse.findUnique({
      where: { slug },
      include: {
        _count: { select: { questions: true } },
      },
    });

    if (!course) {
      throw new NotFoundException(`Driving course "${slug}" not found`);
    }

    return {
      ...course,
      questionCount: course._count.questions,
    };
  }

  async getQuestions(slug: string) {
    const course = await this.prisma.drivingCourse.findUnique({
      where: { slug },
      include: {
        questions: {
          orderBy: { numero: 'asc' },
          include: {
            choices: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Driving course "${slug}" not found`);
    }

    return course.questions;
  }
}
