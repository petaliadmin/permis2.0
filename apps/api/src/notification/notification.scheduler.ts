import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notif: NotificationService,
    private push: PushService
  ) {}

  /**
   * Every day at 18:00 — warn users whose streak is at risk.
   * Targets users who have a streak > 0 but haven't played today.
   */
  @Cron('0 18 * * *')
  async streakReminder() {
    this.logger.log('Running streak reminder');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const atRisk = await this.prisma.dailyStreak.findMany({
      where: {
        currentStreak: { gt: 0 },
        lastActivityDate: { lt: today },
      },
      select: { userId: true, currentStreak: true },
    });

    for (const s of atRisk) {
      const title = '🔥 Ton streak est en danger !';
      const body = `Tu as ${s.currentStreak} jours de streak. Joue maintenant pour ne pas le perdre !`;
      await this.notif.create(s.userId, title, body, 'warning');
      await this.push.sendToUser(s.userId, title, body, '/quizz');
    }

    this.logger.log(`Streak reminders sent to ${atRisk.length} users`);
  }

  /**
   * Every day at 10:00 — re-engage users absent for 2+ days.
   */
  @Cron('0 10 * * *')
  async comebackReminder() {
    this.logger.log('Running comeback reminder');
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    // Users who have some activity but whose last streak activity was 2+ days ago
    const absent = await this.prisma.dailyStreak.findMany({
      where: { lastActivityDate: { lt: twoDaysAgo } },
      select: { userId: true },
    });

    const messages = [
      {
        title: '📚 Révise ton Code !',
        body: "Quelques quiz t'attendent. Continue ta progression !",
      },
      {
        title: '🚗 Prêt pour la route ?',
        body: "Un peu de révision aujourd'hui fait toute la différence !",
      },
      {
        title: '🏆 Reprends ta progression',
        body: "Tes séries t'attendent. Reviens jouer maintenant !",
      },
    ];

    for (const u of absent) {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      await this.notif.create(u.userId, msg.title, msg.body, 'info');
      await this.push.sendToUser(u.userId, msg.title, msg.body);
    }

    this.logger.log(`Comeback reminders sent to ${absent.length} users`);
  }

  /**
   * Every Sunday at 11:00 — weekly progress summary.
   */
  @Cron('0 11 * * 0')
  async weeklySummary() {
    this.logger.log('Running weekly summary');
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const active = await this.prisma.progress.groupBy({
      by: ['userId'],
      where: { updatedAt: { gte: weekAgo } },
      _sum: { totalQuestions: true, correctAnswers: true },
    });

    for (const u of active) {
      const total = u._sum.totalQuestions ?? 0;
      const correct = u._sum.correctAnswers ?? 0;
      const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
      const title = '📊 Ton bilan de la semaine';
      const body = `${total} questions répondues · ${pct}% de réussite. Continue comme ça !`;
      await this.notif.create(u.userId, title, body, 'success');
      await this.push.sendToUser(u.userId, title, body);
    }

    this.logger.log(`Weekly summaries sent to ${active.length} users`);
  }

  /**
   * Every day at 9:00 — motivational goal for the day.
   * Targets authenticated users who haven't received this today.
   */
  @Cron('0 9 * * *')
  async dailyGoal() {
    this.logger.log('Running daily goal nudge');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Only target users who haven't received a daily-goal notif today already
    const alreadySent = await this.prisma.notification.findMany({
      where: {
        title: { contains: 'objectif' },
        createdAt: { gte: todayStart },
      },
      select: { userId: true },
    });
    const alreadySentIds = new Set(alreadySent.map((n) => n.userId));

    const users = await this.prisma.user.findMany({
      select: { id: true },
      where: { id: { notIn: [...alreadySentIds] } },
      take: 500,
    });

    const goals = [
      { title: '🎯 Objectif du jour', body: "Termine 3 séries de quiz aujourd'hui !" },
      { title: '💡 Savais-tu ?', body: 'Réviser 15 min/jour suffit pour réussir ton Code.' },
      { title: '🚦 Défi panneaux', body: 'Teste tes connaissances sur les panneaux du Code !' },
    ];

    for (const u of users) {
      if (alreadySentIds.has(u.id)) continue;
      const msg = goals[Math.floor(Math.random() * goals.length)];
      await this.notif.create(u.id, msg.title, msg.body, 'info');
    }

    this.logger.log(`Daily goal sent to ${users.length} users`);
  }
}
