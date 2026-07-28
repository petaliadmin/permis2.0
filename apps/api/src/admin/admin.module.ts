import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { ShopModule } from '../shop/shop.module';
import { SchoolModule } from '../school/school.module';

@Module({
  imports: [ShopModule, SchoolModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
})
export class AdminModule {}
