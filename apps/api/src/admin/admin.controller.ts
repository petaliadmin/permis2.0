import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@permis2.0/types';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SetBlockedDto } from './dto/set-blocked.dto';
import { QuestionInputDto } from './dto/question-input.dto';
import { SeriesInputDto } from './dto/series-input.dto';
import { LessonInputDto } from './dto/lesson-input.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private adminService: AdminService
  ) {}

  // ─── Dashboard ───────────────────────────────────────────────────────────────

  @Get('stats')
  async getStats() {
    const [usersCount, categoriesCount, lessonsCount, questionsCount, purchasesCount, examsCount] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.category.count(),
        this.prisma.lesson.count(),
        this.prisma.question.count(),
        this.prisma.purchase.count({ where: { status: 'PAID' } }),
        this.prisma.examResult.count(),
      ]);

    return {
      success: true,
      data: {
        usersCount,
        categoriesCount,
        lessonsCount,
        questionsCount,
        purchasesCount,
        examsCount,
      },
    };
  }

  @Get('revenue')
  async getRevenue() {
    return this.adminService.getRevenue();
  }

  // ─── Users ───────────────────────────────────────────────────────────────────

  @Get('users/:id/details')
  @ApiResponse({ status: 200, description: 'User details: subscription, purchases, activity' })
  async getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Patch('users/:id/role')
  @ApiResponse({ status: 403, description: 'Cannot change your own role' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Request() req) {
    // An admin cannot demote themself — avoids locking every admin out.
    if (req.user.userId === id) {
      throw new ForbiddenException('Impossible de modifier son propre rôle');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: { id: true, name: true, phone: true, email: true, role: true },
    });
  }

  @Patch('users/:id/block')
  @ApiResponse({ status: 403, description: 'Cannot block yourself' })
  async setBlocked(@Param('id') id: string, @Body() dto: SetBlockedDto, @Request() req) {
    if (req.user.userId === id) {
      throw new ForbiddenException('Impossible de bloquer son propre compte');
    }
    return this.adminService.setBlocked(id, dto.blocked);
  }

  // Manual subscription activation (temporary WhatsApp payment flow)
  @Post('users/:id/subscription')
  @ApiResponse({ status: 201, description: 'Subscription granted manually' })
  async grantSubscription(@Param('id') id: string, @Query('sku') sku?: string) {
    return this.adminService.grantSubscription(id, sku || 'abo_annuel');
  }

  @Delete('users/:id/subscription')
  @ApiResponse({ status: 200, description: 'Subscription revoked' })
  async revokeSubscription(@Param('id') id: string, @Query('sku') sku?: string) {
    return this.adminService.revokeSubscription(id, sku || 'abo_annuel');
  }

  // ─── Purchase requests ───────────────────────────────────────────────────────

  @Get('purchases')
  @ApiResponse({ status: 200, description: 'Purchases, optionally filtered by status' })
  async listPurchases(@Query('status') status?: string) {
    return this.adminService.listPurchases(status);
  }

  @Post('purchases/:id/confirm')
  @ApiResponse({ status: 201, description: 'Purchase confirmed and entitlement granted' })
  async confirmPurchase(@Param('id') id: string) {
    return this.adminService.confirmPurchase(id);
  }

  // ─── Questions (quiz) ────────────────────────────────────────────────────────

  @Get('questions')
  async listQuestions(
    @Query('skip') skip = '0',
    @Query('take') take = '10',
    @Query('q') q?: string,
    @Query('serieId') serieId?: string
  ) {
    return this.adminService.listQuestions(
      parseInt(String(skip), 10),
      parseInt(String(take), 10),
      q,
      serieId
    );
  }

  @Post('questions')
  async createQuestion(@Body() dto: QuestionInputDto) {
    return this.adminService.createQuestion(dto);
  }

  @Patch('questions/:id')
  async updateQuestion(@Param('id') id: string, @Body() dto: QuestionInputDto) {
    return this.adminService.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  async deleteQuestion(@Param('id') id: string) {
    return this.adminService.deleteQuestion(id);
  }

  // ─── Series (examens) ────────────────────────────────────────────────────────

  @Get('series')
  async listSeries() {
    return this.adminService.listSeries();
  }

  @Post('series')
  async createSeries(@Body() dto: SeriesInputDto) {
    return this.adminService.createSeries(dto);
  }

  @Patch('series/:id')
  async updateSeries(@Param('id') id: string, @Body() dto: SeriesInputDto) {
    return this.adminService.updateSeries(id, dto);
  }

  @Delete('series/:id')
  async deleteSeries(@Param('id') id: string) {
    return this.adminService.deleteSeries(id);
  }

  // ─── Lessons (cours) ─────────────────────────────────────────────────────────

  @Post('lessons')
  async createLesson(@Body() dto: LessonInputDto) {
    return this.adminService.createLesson(dto);
  }

  @Patch('lessons/:id')
  async updateLesson(@Param('id') id: string, @Body() dto: LessonInputDto) {
    return this.adminService.updateLesson(id, dto);
  }

  @Delete('lessons/:id')
  async deleteLesson(@Param('id') id: string) {
    return this.adminService.deleteLesson(id);
  }
}
