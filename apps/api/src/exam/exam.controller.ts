import { Controller, Post, Get, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { SubmitAnswerDto } from '../series/dto/submit-answer.dto';
import { StartExamDto } from './dto/start-exam.dto';

@ApiTags('Exams')
@Controller('exams')
export class ExamController {
  constructor(private examService: ExamService) {}

  @Post('start')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Exam started' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async startExam(@Request() req, @Body() dto: StartExamDto) {
    return this.examService.startExam(req.user.userId, dto);
  }

  // Diapo (image-based) mock-exam content — public: the page itself gates
  // premium series behind entitlements.
  @Get('diapos')
  @ApiResponse({ status: 200, description: 'List of diapo exam series' })
  async listDiapos() {
    return this.examService.listDiapos();
  }

  @Get('diapos/:id')
  @ApiResponse({ status: 200, description: 'Single diapo exam with its questions' })
  @ApiResponse({ status: 404, description: 'Diapo not found' })
  async getDiapo(@Param('id') id: string) {
    return this.examService.getDiapo(parseInt(id, 10));
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
    @Request() req
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
  async getResults(@Param('id') examId: string, @Request() req) {
    return this.examService.getExamResult(examId, req.user.userId);
  }

  @Get('history/list')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User exam history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(@Request() req, @Query('skip') skip?: string, @Query('take') take?: string) {
    return this.examService.getExamHistory(
      req.user.userId,
      parseInt(skip ?? '0', 10),
      parseInt(take ?? '10', 10)
    );
  }
}
