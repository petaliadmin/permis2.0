import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { ExamTemplateController } from './exam-template.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EntitlementModule } from '../entitlement/entitlement.module';

@Module({
  imports: [PrismaModule, EntitlementModule],
  controllers: [ExamController, ExamTemplateController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
