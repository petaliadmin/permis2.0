import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PermitPriceService } from './permit-price.service';

@ApiTags('Permit Prices')
@Controller('permit-prices')
export class PermitPriceController {
  constructor(private permitPriceService: PermitPriceService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Reference permit prices by city and category' })
  async findAll() {
    return this.permitPriceService.findAll();
  }
}
