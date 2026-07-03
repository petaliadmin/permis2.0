import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
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
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.trafficSignService.findAll(
      parseInt(skip ?? '0', 10),
      parseInt(take ?? '20', 10),
    );
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
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    if (!query || query.length < 2) {
      return { data: [], query, total: 0, message: 'Query too short' };
    }
    return this.trafficSignService.search(query, parseInt(skip ?? '0', 10), parseInt(take ?? '20', 10));
  }

  @Get('category/:category')
  @ApiResponse({ status: 200, description: 'Signs by category' })
  async findByCategory(
    @Param('category') category: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.trafficSignService.findByCategory(category, parseInt(skip ?? '0', 10), parseInt(take ?? '20', 10));
  }

  @Get(':id/related')
  @ApiResponse({ status: 200, description: 'Related traffic signs' })
  async getRelated(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.trafficSignService.getRelatedSigns(id, parseInt(limit ?? '5', 10));
  }

  @Get(':id/questions')
  @ApiResponse({ status: 200, description: 'Questions using this sign' })
  async getQuestions(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.trafficSignService.getQuestionsForSign(id, parseInt(limit ?? '5', 10));
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin only' })
  async seedFromQuestions(@Request() req) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return this.trafficSignService.seedTrafficSignsFromQuestions();
  }

  @Get('extract/list')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Extracted signs from questions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin only' })
  async extractSigns(@Request() req) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    const signs = await this.trafficSignService.extractSignsFromQuestions();
    return {
      signs,
      total: signs.length,
      categories: SIGN_CATEGORIES,
    };
  }
}
