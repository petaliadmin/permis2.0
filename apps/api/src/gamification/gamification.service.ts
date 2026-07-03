import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface XPReward {
  correctAnswer: number;
  seriesPerfect: number; // 25/25
  streakBonus: number;
}

export const XP_RULES: XPReward = {
  correctAnswer: 10,
  seriesPerfect: 50, // bonus for getting 25/25
  streakBonus: 5, // per day in streak
};

export const LEVEL_THRESHOLDS = {
  'Débutant': 0,
  'Intermédiaire': 100,
  'Confirmé': 300,
  'Expert': 600,
};

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async addXP(userId: string, amount: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const newXP = user.xp + amount;
    const newLevel = this.calculateLevel(newXP);
    const levelUp = newLevel !== user.level;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { xp: newXP, level: newLevel },
    });

    return { xpEarned: amount, newXP, newLevel, levelUp };
  }

  async checkDailyStreak(userId: string) {
    let streak = await this.prisma.dailyStreak.findUnique({
      where: { userId },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!streak) {
      // Create new streak
      streak = await this.prisma.dailyStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
        },
      });
      return { currentStreak: 1, longestStreak: 1, isNewStreak: true };
    }

    const lastActivity = new Date(
      streak.lastActivityDate!.getFullYear(),
      streak.lastActivityDate!.getMonth(),
      streak.lastActivityDate!.getDate()
    );

    // Check if activity is today
    if (lastActivity.getTime() === today.getTime()) {
      return { currentStreak: streak.currentStreak, longestStreak: streak.longestStreak };
    }

    // Check if activity is yesterday (continue streak)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastActivity.getTime() === yesterday.getTime()) {
      const newCurrent = streak.currentStreak + 1;
      const newLongest = Math.max(newCurrent, streak.longestStreak);

      const updated = await this.prisma.dailyStreak.update({
        where: { userId },
        data: {
          currentStreak: newCurrent,
          longestStreak: newLongest,
          lastActivityDate: today,
        },
      });

      return {
        currentStreak: updated.currentStreak,
        longestStreak: updated.longestStreak,
        streakIncremented: true,
      };
    }

    // Streak broken, reset to 1
    const updated = await this.prisma.dailyStreak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        lastActivityDate: today,
      },
    });

    return {
      currentStreak: 1,
      longestStreak: updated.longestStreak,
      streakBroken: true,
    };
  }

  async unlockBadge(userId: string, badgeName: string, description: string, icon: string) {
    try {
      const badge = await this.prisma.badge.create({
        data: {
          userId,
          name: badgeName,
          description,
          icon,
        },
      });
      return { badge, unlocked: true };
    } catch (error) {
      // Badge already unlocked
      return { unlocked: false };
    }
  }

  async checkAndUnlockAchievements(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    const unlockedBadges: string[] = [];

    // First test
    const exams = await this.prisma.examResult.count({ where: { userId } });
    if (exams === 1) {
      const result = await this.unlockBadge(
        userId,
        'first_test',
        'Completed your first test',
        '🏆'
      );
      if (result.unlocked) unlockedBadges.push('First Test');
    }

    // 100 correct answers
    const stats = await this.prisma.statistic.findMany({ where: { userId } });
    const totalCorrect = stats.reduce((sum, s) => sum + s.correctAnswers, 0);
    if (totalCorrect >= 100) {
      const result = await this.unlockBadge(
        userId,
        'century_master',
        'Answered 100 questions correctly',
        '💯'
      );
      if (result.unlocked) unlockedBadges.push('Century Master');
    }

    // Series completion badges
    const series = await this.prisma.series.findMany();
    for (const s of series) {
      const progress = await this.prisma.progress.findUnique({
        where: {
          userId_serieId: { userId, serieId: s.id },
        },
      });

      if (progress && progress.accuracy === 100) {
        const badgeName = `series_${s.code.toLowerCase()}_master`;
        const result = await this.unlockBadge(
          userId,
          badgeName,
          `Mastered Series ${s.code}`,
          '⭐'
        );
        if (result.unlocked) unlockedBadges.push(`${s.code} Master`);
      }
    }

    // Level milestones
    if (user.xp >= 100 && !exams) {
      const result = await this.unlockBadge(
        userId,
        'level_intermediate',
        'Reached Intermediate level',
        '📈'
      );
      if (result.unlocked) unlockedBadges.push('Intermediate');
    }

    if (user.xp >= 300) {
      const result = await this.unlockBadge(
        userId,
        'level_confirmed',
        'Reached Confirmed level',
        '🎯'
      );
      if (result.unlocked) unlockedBadges.push('Confirmed');
    }

    if (user.xp >= 600) {
      const result = await this.unlockBadge(
        userId,
        'level_expert',
        'Reached Expert level',
        '👑'
      );
      if (result.unlocked) unlockedBadges.push('Expert');
    }

    return unlockedBadges;
  }

  async getUserBadges(userId: string) {
    return this.prisma.badge.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  async getLeaderboard(limit = 20) {
    const safeLimit = Math.min(limit || 20, 100);
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatar: true,
        xp: true,
        level: true,
      },
      orderBy: { xp: 'desc' },
      take: safeLimit,
    });
  }

  async getLeaderboardRank(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const usersAbove = await this.prisma.user.count({
      where: { xp: { gt: user.xp } },
    });

    const totalUsers = await this.prisma.user.count();

    return {
      rank: usersAbove + 1,
      totalUsers,
      xp: user.xp,
      level: user.level,
    };
  }

  private calculateLevel(xp: number): string {
    if (xp >= LEVEL_THRESHOLDS['Expert']) return 'Expert';
    if (xp >= LEVEL_THRESHOLDS['Confirmé']) return 'Confirmé';
    if (xp >= LEVEL_THRESHOLDS['Intermédiaire']) return 'Intermédiaire';
    return 'Débutant';
  }
}
