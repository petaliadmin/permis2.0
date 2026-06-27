import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TrafficSignService, SIGN_CATEGORIES } from './traffic-sign.service';

@ApiTags('Traffic Signs')
@Controller('traffic-signs')
export class TrafficSignController {
  constructor(private trafficSignService: TrafficSignService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'List of traffic signs' })
  async findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 20,
  ) {
    return this.trafficSignService.findAll(skip, take);
  }

  @Get('categories')
  @ApiResponse({ status: 200, description: 'Traffic sign categories' })
  async getCategories() {
    return this.trafficSignService.getCategories();
  }

  @Get('search')
  @ApiResponse({ status: 200, description: 'Search traffic signs' })
  async search(
    @Query('q') query: string,
    @Query('skip') skip = 0,
    @Query('take') take = 20,
  ) {
    if (!query || query.length < 2) {
      return { data: [], query, total: 0, message: 'Query too short' };
    }
    return this.trafficSignService.search(query, skip, take);
  }

  @Get('category/:category')
  @ApiResponse({ status: 200, description: 'Signs by category' })
  async findByCategory(
    @Param('category') category: string,
    @Query('skip') skip = 0,
    @Query('take') take = 20,
  ) {
    return this.trafficSignService.findByCategory(category, skip, take);
  }

  @Get(':id/related')
  @ApiResponse({ status: 200, description: 'Related traffic signs' })
  async getRelated(@Param('id') id: string, @Query('limit') limit = 5) {
    return this.trafficSignService.getRelatedSigns(id, limit);
  }

  @Get(':id/questions')
  @ApiResponse({ status: 200, description: 'Questions using this sign' })
  async getQuestions(@Param('id') id: string, @Query('limit') limit = 5) {
    return this.trafficSignService.getQuestionsForSign(id, limit);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Traffic sign details' })
  @ApiResponse({ status: 404, description: 'Sign not found' })
  async findById(@Param('id') id: string) {
    const sign = await this.trafficSignService.findById(id);
    const relatedSigns = await this.trafficSignService.getRelatedSigns(id, 3);
    const questions = await this.trafficSignService.getQuestionsForSign(id, 3);

    return {
      ...sign,
      relatedSigns,
      questions,
    };
  }

  @Post('seed')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Traffic signs seeded' })
  async seedFromQuestions() {
    return this.trafficSignService.seedTrafficSignsFromQuestions();
  }

  @Get('extract/list')
  @ApiResponse({ status: 200, description: 'Extracted signs from questions' })
  async extractSigns() {
    const signs = await this.trafficSignService.extractSignsFromQuestions();
    return {
      signs,
      total: signs.length,
      categories: SIGN_CATEGORIES,
    };
  }
}
