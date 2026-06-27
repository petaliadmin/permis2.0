import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionService } from './question.service';

@ApiTags('Questions')
@Controller('questions')
export class QuestionController {
  constructor(private questionService: QuestionService) {}

  @Get('random')
  @ApiResponse({ status: 200, description: 'Random questions' })
  async getRandom(
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit = 10,
  ) {
    return this.questionService.getRandomQuestions(categoryId, limit);
  }

  @Get('category/:categoryId')
  @ApiResponse({ status: 200, description: 'Questions by category' })
  async findByCategory(
    @Param('categoryId') categoryId: string,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    return this.questionService.findByCategory(categoryId, skip, take);
  }

  @Get('favorites')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User favorite questions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFavorites(
    @Request() req,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    return this.questionService.getFavoriteQuestions(req.user.userId, skip, take);
  }

  @Post(':id/favorite')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Favorite toggled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async toggleFavorite(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.questionService.toggleFavoriteQuestion(id, req.user.userId);
  }

  @Get(':id/stats')
  @ApiResponse({ status: 200, description: 'Question statistics' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async getStats(@Param('id') id: string) {
    return this.questionService.getQuestionStats(id);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Question details' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async findById(@Param('id') id: string) {
    return this.questionService.findById(id);
  }
}
