import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SeriesService } from './series.service';
import { EntitlementService } from '../entitlement/entitlement.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@ApiTags('Series')
@Controller('series')
export class SeriesController {
  constructor(
    private seriesService: SeriesService,
    private entitlements: EntitlementService
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiResponse({ status: 200, description: 'List of series (with locked flag)' })
  async findAll(@Request() req) {
    const userId = req.user?.userId;
    const series = await this.seriesService.findAll();
    const keys = await this.entitlements.getKeys(userId);
    const hasPremium = keys.includes('premium_all') || keys.includes('pack_quiz');
    return series.map((s) => ({ ...s, locked: !s.isFree && !hasPremium }));
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Series details' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  async findById(@Param('id') id: string) {
    return this.seriesService.findById(id);
  }

  @Get(':id/questions')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Questions in series' })
  @ApiResponse({ status: 403, description: 'Premium series — entitlement required' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  async getQuestions(@Param('id') id: string, @Request() req) {
    // Validate series exists, then gate premium content server-side.
    const series = await this.seriesService.findById(id);
    const allowed = await this.entitlements.hasAccessToSeries(req.user?.userId, series);
    if (!allowed) {
      throw new ForbiddenException('premium_series');
    }
    return this.seriesService.getQuestionsBySeriesId(id);
  }

  @Get(':id/progress')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User progress in series' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserProgress(@Param('id') id: string, @Request() req) {
    return this.seriesService.getUserSeriesProgress(req.user.userId, id);
  }

  @Post(':id/answer')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Answer submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async submitAnswer(
    @Param('id') questionId: string,
    @Body() submitAnswerDto: SubmitAnswerDto,
    @Request() req
  ) {
    const answer = submitAnswerDto.answers?.[0] ?? submitAnswerDto.answer;
    return this.seriesService.submitAnswer(req.user.userId, questionId, answer);
  }
}
