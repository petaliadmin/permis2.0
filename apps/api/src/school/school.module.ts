import { Module } from '@nestjs/common';
import { SchoolController } from './school.controller';
import { SchoolService } from './school.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchoolRolesGuard } from './guards/school-roles.guard';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [SchoolController],
  providers: [SchoolService, PrismaService, SchoolRolesGuard],
  exports: [SchoolService],
})
export class SchoolModule {}
