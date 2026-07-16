import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [SmsService, PrismaService],
  exports: [SmsService],
})
export class SmsModule {}
