import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type NotifType = 'success' | 'info' | 'warning' | 'error';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async create(userId: string, title: string, message: string, type: NotifType = 'info') {
    return this.prisma.notification.create({
      data: { userId, title, message, type },
    });
  }

  async deleteOne(userId: string, id: string) {
    return this.prisma.notification.deleteMany({ where: { id, userId } });
  }
}
