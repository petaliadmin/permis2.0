import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getLevelFromXP } from '@permis2.0/utils';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({ data: createUserDto });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    if (!email) return null;
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string) {
    if (!phone) return null;
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findAll(skip = 0, take = 10) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          avatar: true,
          xp: true,
          level: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id }, data: updateUserDto });
  }

  async addXP(userId: string, xp: number) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const newXP = user.xp + xp;
    const newLevel = getLevelFromXP(newXP);

    return this.prisma.user.update({
      where: { id: userId },
      data: { xp: newXP, level: newLevel },
    });
  }

  async delete(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.delete({ where: { id } });
  }

  async getUserStats(userId: string) {
    const [user, streak, progress, examCount] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true, level: true, createdAt: true },
      }),
      this.prisma.dailyStreak.findUnique({
        where: { userId },
        select: { currentStreak: true },
      }),
      this.prisma.progress.findMany({
        where: { userId },
        select: { totalQuestions: true, correctAnswers: true },
      }),
      this.prisma.examResult.count({ where: { userId } }),
    ]);

    if (!user) {
      return {
        daysOnApp: 0,
        quizAnswered: 0,
        examCount: 0,
        streak: 0,
        xp: 0,
        level: 'Débutant',
        progressPct: 0,
      };
    }

    const daysOnApp = Math.max(1, Math.ceil((Date.now() - user.createdAt.getTime()) / 86_400_000));
    const quizAnswered = progress.reduce((sum, p) => sum + p.totalQuestions, 0);
    const totalCorrect = progress.reduce((sum, p) => sum + p.correctAnswers, 0);
    const progressPct = quizAnswered > 0 ? Math.round((totalCorrect / quizAnswered) * 100) : 0;

    return {
      daysOnApp,
      quizAnswered,
      examCount,
      streak: streak?.currentStreak ?? 0,
      xp: user.xp,
      level: user.level,
      progressPct,
    };
  }
}
