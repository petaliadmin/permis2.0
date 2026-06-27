import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { SubmitAnswerDto } from '../series/dto/submit-answer.dto';

@ApiTags('Exams')
@Controller('exams')
export class ExamController {
  constructor(private examService: ExamService) {}

  @Post('start')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Exam started' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async startExam(@Request() req, @Body() config?: { numberOfQuestions?: number }) {
    return this.examService.startExam(req.user.userId, config);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Exam status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async getExamStatus(@Param('id') examId: string, @Request() req) {
    return this.examService.getExamStatus(examId, req.user.userId);
  }

  @Post(':id/answer')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Answer submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Exam not in progress' })
  async submitAnswer(
    @Param('id') examId: string,
    @Body() submitAnswerDto: SubmitAnswerDto & { questionId: string; timeSpent?: number },
    @Request() req,
  ) {
    return this.examService.submitAnswer(
      examId,
      req.user.userId,
      submitAnswerDto.questionId,
      submitAnswerDto.answer,
      submitAnswerDto.timeSpent
    );
  }

  @Post(':id/submit')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Exam submitted and completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async submitExam(@Param('id') examId: string, @Request() req) {
    return this.examService.submitExam(examId, req.user.userId);
  }

  @Get(':id/results')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Exam results' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Results not found' })
  async getResults(@Param('id') examId: string) {
    return this.examService.getExamResult(examId);
  }

  @Get('history/list')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User exam history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(
    @Request() req,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    return this.examService.getExamHistory(req.user.userId, skip, take);
  }
}
