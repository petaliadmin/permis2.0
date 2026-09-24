import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionModule } from '../subscription/subscription.module';
import { SchoolModule } from '../school/school.module';

@Module({
  imports: [SubscriptionModule, SchoolModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
})
export class AdminModule {}
