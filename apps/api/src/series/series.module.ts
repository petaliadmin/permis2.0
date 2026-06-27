import { Module } from '@nestjs/common';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [SeriesService, PrismaService],
  controllers: [SeriesController],
  exports: [SeriesService],
})
export class SeriesModule {}
