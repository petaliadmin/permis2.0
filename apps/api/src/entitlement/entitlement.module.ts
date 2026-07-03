import { Module } from '@nestjs/common';
import { EntitlementService } from './entitlement.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [EntitlementService, PrismaService],
  exports: [EntitlementService],
})
export class EntitlementModule {}
