import { Module } from '@nestjs/common';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementModule } from '../entitlement/entitlement.module';

@Module({
  imports: [EntitlementModule],
  providers: [SeriesService, PrismaService],
  controllers: [SeriesController],
  exports: [SeriesService],
})
export class SeriesModule {}
