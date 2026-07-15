import { Module } from '@nestjs/common';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementModule } from '../entitlement/entitlement.module';
import { PaymentService } from './payment/payment.service';
import { SandboxProvider } from './payment/providers/sandbox.provider';
import { BictorysProvider } from './payment/providers/bictorys.provider';

@Module({
  imports: [EntitlementModule],
  controllers: [ShopController],
  providers: [ShopService, PrismaService, PaymentService, SandboxProvider, BictorysProvider],
  exports: [ShopService],
})
export class ShopModule {}
