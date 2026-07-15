import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoryService } from './category.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'List of categories' })
  async findAll(@Query('skip') skip = '0', @Query('take') take = '10') {
    return this.categoryService.findAll(parseInt(String(skip), 10), parseInt(String(take), 10));
  }

  @Get('search')
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(@Query('q') query: string, @Query('skip') skip = '0', @Query('take') take = '10') {
    return this.categoryService.search(
      query,
      parseInt(String(skip), 10),
      parseInt(String(take), 10)
    );
  }

  @Get('progress')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User progress by category' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserProgress(@Request() req, @Query('skip') skip = '0', @Query('take') take = '10') {
    return this.categoryService.getUserCategoryProgress(
      req.user.userId,
      parseInt(String(skip), 10),
      parseInt(String(take), 10)
    );
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Category details' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }
}
