import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

/**
 * "Examen Blanc" catalog (Sprint 6). A separate path from `exams/:id` so it
 * never collides with the exam-by-id route. Guest-readable (OptionalJwtAuthGuard)
 * so the list shows with 🔒 badges; each template carries a `locked` flag for
 * the current viewer.
 */
@ApiTags('Exam Templates')
@Controller('exam-templates')
export class ExamTemplateController {
  constructor(private examService: ExamService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiResponse({ status: 200, description: 'List of exam templates (with locked flag)' })
  async list(@Request() req) {
    return this.examService.listTemplates(req.user?.userId);
  }
}
