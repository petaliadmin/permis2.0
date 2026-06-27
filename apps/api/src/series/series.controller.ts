import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SeriesService } from './series.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@ApiTags('Series')
@Controller('series')
export class SeriesController {
  constructor(private seriesService: SeriesService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'List of series' })
  async findAll() {
    return this.seriesService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Series details' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  async findById(@Param('id') id: string) {
    return this.seriesService.findById(id);
  }

  @Get(':id/questions')
  @ApiResponse({ status: 200, description: 'Questions in series' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  async getQuestions(@Param('id') id: string) {
    // Validate series exists
    await this.seriesService.findById(id);
    return this.seriesService.getQuestionsBySeriesId(id);
  }

  @Get(':id/progress')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User progress in series' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserProgress(
    @Param('id') id: string,
    @Request() req,
  ) {
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
    @Request() req,
  ) {
    return this.seriesService.submitAnswer(
      req.user.userId,
      questionId,
      submitAnswerDto.answer,
    );
  }
}
