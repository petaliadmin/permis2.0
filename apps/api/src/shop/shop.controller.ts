import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  UseGuards,
  Request,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RawBodyRequest } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ShopService } from './shop.service';
import { CheckoutDto } from './dto/checkout.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Shop')
@Controller('shop')
export class ShopController {
  constructor(private shopService: ShopService) {}

  @Get('products')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Boutique catalog (with owned flag)' })
  async products(@Request() req) {
    return this.shopService.listProducts(req.user?.userId);
  }

  @Get('entitlements')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Current user entitlements' })
  async entitlements(@Request() req) {
    return this.shopService.getEntitlements(req.user.userId);
  }

  @Get('purchases')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Purchase history' })
  async purchases(@Request() req) {
    return this.shopService.getPurchases(req.user.userId);
  }

  @Get('purchases/:purchaseId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Single purchase' })
  async getPurchase(@Request() req, @Param('purchaseId') purchaseId: string) {
    return this.shopService.getPurchase(req.user.userId, purchaseId);
  }

  @Get('checkout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Latest pending checkout for the current user (null if none)',
  })
  async getPendingCheckout(@Request() req) {
    return this.shopService.getPendingCheckout(req.user.userId);
  }

  @Post('checkout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Checkout created (PENDING)' })
  async checkout(@Request() req, @Body() dto: CheckoutDto) {
    return this.shopService.checkout(req.user.userId, dto);
  }

  @Post('webhook/:provider')
  @ApiResponse({ status: 200, description: 'Payment provider callback' })
  async webhook(
    @Param('provider') provider: string,
    @Body() payload: unknown,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<ExpressRequest>
  ) {
    const rawBody = req.rawBody?.toString('utf-8');
    return this.shopService.handleWebhook(provider, payload, headers, rawBody);
  }

  // Dev-only: simulate a Mobile Money confirmation for a sandbox purchase.
  @Post('purchases/:purchaseId/simulate-confirm')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Purchase confirmed (sandbox/dev)' })
  async confirm(@Request() req, @Param('purchaseId') purchaseId: string) {
    return this.shopService.devConfirm(req.user.userId, purchaseId);
  }
}
