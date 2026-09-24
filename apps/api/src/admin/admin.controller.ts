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
import { SuspendUserDto } from './dto/suspend-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { QuestionInputDto } from './dto/question-input.dto';
import { SeriesInputDto } from './dto/series-input.dto';
import { LessonInputDto } from './dto/lesson-input.dto';
import { ArticleInputDto } from './dto/article-input.dto';
import { SubscriptionPlanInputDto } from '../subscription/dto/subscription-plan-input.dto';
import { UpdateSchoolStatusDto } from './dto/update-school-status.dto';
import type { SubscriptionType } from '@prisma/client';

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
    const [
      usersCount,
      categoriesCount,
      lessonsCount,
      questionsCount,
      purchasesCount,
      examsCount,
      seriesCount,
      trafficSignsCount,
      schoolsByStatus,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.category.count(),
      this.prisma.lesson.count(),
      this.prisma.question.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.examResult.count(),
      this.prisma.series.count(),
      this.prisma.trafficSign.count(),
      this.prisma.school.groupBy({ by: ['status'], _count: true }),
    ]);

    const schoolsByStatusMap = { PENDING: 0, ACTIVE: 0, SUSPENDED: 0 };
    let schoolsCount = 0;
    for (const row of schoolsByStatus) {
      schoolsByStatusMap[row.status as keyof typeof schoolsByStatusMap] = row._count;
      schoolsCount += row._count;
    }

    return {
      success: true,
      data: {
        usersCount,
        categoriesCount,
        lessonsCount,
        questionsCount,
        purchasesCount,
        examsCount,
        seriesCount,
        trafficSignsCount,
        schoolsCount,
        schoolsByStatus: schoolsByStatusMap,
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

  @Patch('users/:id/suspend')
  @ApiResponse({ status: 403, description: 'Cannot suspend yourself' })
  async suspendUser(@Param('id') id: string, @Body() dto: SuspendUserDto, @Request() req) {
    if (req.user.userId === id) {
      throw new ForbiddenException('Impossible de suspendre son propre compte');
    }
    return this.adminService.suspendUser(id, dto.days);
  }

  @Delete('users/:id/suspend')
  @ApiResponse({ status: 200, description: 'Suspension lifted' })
  async unsuspendUser(@Param('id') id: string) {
    return this.adminService.unsuspendUser(id);
  }

  @Patch('users/:id')
  @ApiResponse({ status: 200, description: 'User profile updated by an admin' })
  async updateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  // Manual subscription activation (temporary WhatsApp payment flow)
  @Post('users/:id/subscription')
  @ApiResponse({ status: 201, description: 'Subscription granted manually' })
  async grantSubscription(@Param('id') id: string, @Query('planId') planId?: string) {
    return this.adminService.grantSubscription(id, planId);
  }

  @Delete('users/:id/subscription')
  @ApiResponse({ status: 200, description: 'Subscription revoked' })
  async revokeSubscription(@Param('id') id: string) {
    return this.adminService.revokeSubscription(id);
  }

  // ─── Subscription requests ────────────────────────────────────────────────────

  @Get('subscriptions')
  @ApiResponse({ status: 200, description: 'Subscriptions, optionally filtered by status/type' })
  async listSubscriptions(
    @Query('status') status?: string,
    @Query('type') type?: SubscriptionType
  ) {
    return this.adminService.listSubscriptions(status, type);
  }

  @Post('subscriptions/:id/confirm')
  @ApiResponse({ status: 201, description: 'Subscription confirmed and activated' })
  async confirmSubscription(@Param('id') id: string) {
    return this.adminService.confirmSubscription(id);
  }

  // ─── Schools (multi-tenant, Phase 0) ─────────────────────────────────────────

  @Get('schools')
  @ApiResponse({ status: 200, description: 'All schools, any status (moderation view)' })
  async listSchools() {
    return this.adminService.listSchools();
  }

  @Patch('schools/:id/status')
  @ApiResponse({ status: 200, description: 'School status updated (PENDING/ACTIVE/SUSPENDED)' })
  async updateSchoolStatus(@Param('id') id: string, @Body() dto: UpdateSchoolStatusDto) {
    return this.adminService.updateSchoolStatus(id, dto.status);
  }

  @Delete('schools/:id')
  @ApiResponse({ status: 200, description: 'School permanently deleted' })
  async deleteSchool(@Param('id') id: string) {
    return this.adminService.deleteSchool(id);
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

  // ─── Articles (blog) ─────────────────────────────────────────────────────────

  @Get('articles')
  async listArticles() {
    return this.adminService.listArticles();
  }

  @Post('articles')
  async createArticle(@Body() dto: ArticleInputDto) {
    return this.adminService.createArticle(dto);
  }

  @Patch('articles/:id')
  async updateArticle(@Param('id') id: string, @Body() dto: ArticleInputDto) {
    return this.adminService.updateArticle(id, dto);
  }

  @Delete('articles/:id')
  async deleteArticle(@Param('id') id: string) {
    return this.adminService.deleteArticle(id);
  }

  // ─── Subscription plan pricing (élève / école / mise en avant) ───────────────

  @Get('subscription-plans')
  async listSubscriptionPlans() {
    return this.adminService.listSubscriptionPlans();
  }

  @Post('subscription-plans')
  async createSubscriptionPlan(@Body() dto: SubscriptionPlanInputDto) {
    return this.adminService.createSubscriptionPlan(dto);
  }

  @Patch('subscription-plans/:id')
  async updateSubscriptionPlan(@Param('id') id: string, @Body() dto: SubscriptionPlanInputDto) {
    return this.adminService.updateSubscriptionPlan(id, dto);
  }

  @Delete('subscription-plans/:id')
  async deleteSubscriptionPlan(@Param('id') id: string) {
    return this.adminService.deleteSubscriptionPlan(id);
  }
}
