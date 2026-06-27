import { Module } from '@nestjs/common';
import { TrafficSignService } from './traffic-sign.service';
import { TrafficSignController } from './traffic-sign.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TrafficSignController],
  providers: [TrafficSignService],
  exports: [TrafficSignService],
})
export class TrafficSignModule {}
