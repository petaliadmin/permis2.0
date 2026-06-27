import { Module } from '@nestjs/common';
import { AiCoachService } from './ai-coach.service';
import { AiCoachController } from './ai-coach.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiCoachController],
  providers: [AiCoachService],
  exports: [AiCoachService],
})
export class AiCoachModule {}
