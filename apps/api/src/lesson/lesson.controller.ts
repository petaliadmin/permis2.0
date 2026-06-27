import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LessonService } from './lesson.service';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonController {
  constructor(private lessonService: LessonService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'List of lessons' })
  async findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    return this.lessonService.findAll(skip, take);
  }

  @Get('search')
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Query('q') query: string,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    return this.lessonService.search(query, skip, take);
  }

  @Get('favorites')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User favorite lessons' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFavorites(
    @Request() req,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    return this.lessonService.getFavorites(req.user.userId, skip, take);
  }

  @Get('category/:categoryId')
  @ApiResponse({ status: 200, description: 'Lessons by category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findByCategory(
    @Param('categoryId') categoryId: string,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    return this.lessonService.findByCategory(categoryId, skip, take);
  }

  @Post(':id/favorite')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Favorite toggled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async toggleFavorite(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.lessonService.toggleFavorite(id, req.user.userId);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Lesson details' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async findById(@Param('id') id: string) {
    return this.lessonService.findById(id);
  }
}
