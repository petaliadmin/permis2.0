import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { ArticleService } from './article.service';

@ApiTags('Articles')
@Controller('articles')
export class ArticleController {
  constructor(private articleService: ArticleService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'List of published articles' })
  async findAll() {
    return this.articleService.findAllPublished();
  }

  @Get(':slug')
  @ApiResponse({ status: 200, description: 'Article details' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.articleService.findBySlug(slug);
  }
}
