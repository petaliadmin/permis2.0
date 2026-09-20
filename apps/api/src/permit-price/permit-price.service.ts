import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermitPriceService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permitPrice.findMany({
      orderBy: [{ city: 'asc' }, { category: 'asc' }],
    });
  }
}
