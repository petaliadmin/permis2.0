import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PlatformStatsService } from './platform-stats.service';

@ApiTags('Platform Stats')
@Controller('stats')
export class PlatformStatsController {
  constructor(private platformStatsService: PlatformStatsService) {}

  @Get('platform')
  @ApiResponse({ status: 200, description: 'Real, computed platform-wide numbers for the homepage' })
  async platform() {
    return this.platformStatsService.getPlatformStats();
  }
}
