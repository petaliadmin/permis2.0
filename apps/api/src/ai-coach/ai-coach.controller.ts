import {
  Controller,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiCoachService } from './ai-coach.service';

@ApiTags('AI Coach')
@Controller('ai-coach')
export class AiCoachController {
  constructor(private aiCoachService: AiCoachService) {}

  @Get('analysis')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Personalized AI coach analysis' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAnalysis(@Request() req) {
    return this.aiCoachService.generateAnalysis(req.user.userId);
  }
}
