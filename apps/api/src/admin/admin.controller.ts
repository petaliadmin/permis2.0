import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@permis2.0/types';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('stats')
  async getStats() {
    const [usersCount, categoriesCount, lessonsCount, questionsCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.category.count(),
      this.prisma.lesson.count(),
      this.prisma.question.count(),
    ]);

    return {
      success: true,
      data: { usersCount, categoriesCount, lessonsCount, questionsCount },
    };
  }
}
