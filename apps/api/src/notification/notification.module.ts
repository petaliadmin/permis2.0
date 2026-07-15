import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationScheduler } from './notification.scheduler';
import { PushService } from './push.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationScheduler, PushService, PrismaService],
  exports: [NotificationService, PushService],
})
export class NotificationModule {}
