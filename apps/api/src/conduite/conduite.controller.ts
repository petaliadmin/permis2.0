import { Controller, Get, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { ConduiteService } from './conduite.service';
import { EntitlementService } from '../entitlement/entitlement.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Conduite')
@Controller('conduite')
export class ConduiteController {
  constructor(
    private conduiteService: ConduiteService,
    private entitlements: EntitlementService
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiResponse({ status: 200, description: 'List of driving courses (with locked flag)' })
  async findAll(@Request() req) {
    const userId = req.user?.userId;
    const courses = await this.conduiteService.findAll();
    return Promise.all(
      courses.map(async (c) => ({
        ...c,
        locked: !(await this.entitlements.hasAccessToCourse(userId, c)),
      }))
    );
  }

  @Get(':slug')
  @ApiResponse({ status: 200, description: 'Driving course details' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.conduiteService.findBySlug(slug);
  }

  @Get(':slug/questions')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Questions for a driving course' })
  @ApiResponse({ status: 403, description: 'Premium course — entitlement required' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getQuestions(@Param('slug') slug: string, @Request() req) {
    const course = await this.conduiteService.findBySlug(slug);
    const allowed = await this.entitlements.hasAccessToCourse(req.user?.userId, course);
    if (!allowed) {
      throw new ForbiddenException('premium_course');
    }
    return this.conduiteService.getQuestions(slug);
  }
}
