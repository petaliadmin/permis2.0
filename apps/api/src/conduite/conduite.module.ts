import { Module } from '@nestjs/common';
import { ConduiteService } from './conduite.service';
import { ConduiteController } from './conduite.controller';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementModule } from '../entitlement/entitlement.module';

@Module({
  imports: [EntitlementModule],
  providers: [ConduiteService, PrismaService],
  controllers: [ConduiteController],
  exports: [ConduiteService],
})
export class ConduiteModule {}
