import { Module } from '@nestjs/common';
import { PlatformStatsController } from './platform-stats.controller';
import { PlatformStatsService } from './platform-stats.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [PlatformStatsService, PrismaService],
  controllers: [PlatformStatsController],
  exports: [PlatformStatsService],
})
export class PlatformStatsModule {}
