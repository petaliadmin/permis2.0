import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getLevelFromXP } from '@permis2.0/utils';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({ data: createUserDto });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    if (!email) return null;
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string) {
    if (!phone) return null;
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findAll(skip = 0, take = 10) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          avatar: true,
          xp: true,
          level: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id }, data: updateUserDto });
  }

  async addXP(userId: string, xp: number) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const newXP = user.xp + xp;
    const newLevel = getLevelFromXP(newXP);

    return this.prisma.user.update({
      where: { id: userId },
      data: { xp: newXP, level: newLevel },
    });
  }

  async delete(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.delete({ where: { id } });
  }
}
