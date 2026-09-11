import { Module } from '@nestjs/common';
import { SchoolController } from './school.controller';
import { SchoolService } from './school.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchoolRolesGuard } from './guards/school-roles.guard';
import { NotificationModule } from '../notification/notification.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [NotificationModule, EmailModule],
  controllers: [SchoolController],
  providers: [SchoolService, PrismaService, SchoolRolesGuard],
  exports: [SchoolService],
})
export class SchoolModule {}
