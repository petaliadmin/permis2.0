import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@permis2.0/types';
import { AuthGuard } from '@nestjs/passport';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor() {}

  @Get('stats')
  getStats() {
    return {
      success: true,
      data: {
        usersCount: 0,
        categoriesCount: 0,
        lessonsCount: 0,
        questionsCount: 0,
      }
    };
  }
}
