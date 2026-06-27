import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';

@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private gamificationService: GamificationService) {}

  @Get('badges')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User badges' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBadges(@Request() req) {
    return this.gamificationService.getUserBadges(req.user.userId);
  }

  @Get('leaderboard')
  @ApiResponse({ status: 200, description: 'Global leaderboard' })
  async getLeaderboard(@Query('limit') limit = 100) {
    const parsed = parseInt(limit as any, 10) || 100;
    return this.gamificationService.getLeaderboard(parsed);
  }

  @Get('rank')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User rank' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRank(@Request() req) {
    return this.gamificationService.getLeaderboardRank(req.user.userId);
  }

  @Post('check-achievements')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'New achievements unlocked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkAchievements(@Request() req) {
    return this.gamificationService.checkAndUnlockAchievements(req.user.userId);
  }
}
