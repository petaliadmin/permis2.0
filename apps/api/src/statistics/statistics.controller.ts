import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @Get('overview')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User statistics overview' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOverview(@Request() req) {
    return this.statisticsService.getUserStatistics(req.user.userId);
  }

  @Get('categories')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Category statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCategoryStatistics(@Request() req) {
    return this.statisticsService.getCategoryStatistics(req.user.userId);
  }

  @Get('progress')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Progress over time' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProgress(@Request() req, @Query('days') days = 30) {
    return this.statisticsService.getProgressOverTime(req.user.userId, parseInt(days as any, 10));
  }

  @Get('activity')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Daily activity' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActivity(@Request() req, @Query('days') days = 30) {
    return this.statisticsService.getDailyActivity(req.user.userId, parseInt(days as any, 10));
  }

  @Get('weak-areas')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Weak areas' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWeakAreas(@Request() req, @Query('limit') limit = 5) {
    return this.statisticsService.getWeakAreas(req.user.userId, parseInt(limit as any, 10));
  }

  @Get('strong-areas')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Strong areas' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStrongAreas(@Request() req, @Query('limit') limit = 5) {
    return this.statisticsService.getStrongAreas(req.user.userId, parseInt(limit as any, 10));
  }

  @Get('streak')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Study streak' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStreak(@Request() req) {
    return this.statisticsService.getStudyStreak(req.user.userId);
  }

  @Get('comparison')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Comparison statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getComparison(@Request() req) {
    return this.statisticsService.getComparisonStats(req.user.userId);
  }

  @Get('recommendations')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Personalized recommendations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecommendations(@Request() req) {
    return this.statisticsService.getRecommendations(req.user.userId);
  }
}
