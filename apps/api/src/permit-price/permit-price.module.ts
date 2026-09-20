import { Module } from '@nestjs/common';
import { PermitPriceController } from './permit-price.controller';
import { PermitPriceService } from './permit-price.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [PermitPriceService, PrismaService],
  controllers: [PermitPriceController],
  exports: [PermitPriceService],
})
export class PermitPriceModule {}
