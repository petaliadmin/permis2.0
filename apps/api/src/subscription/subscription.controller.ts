import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { SubscriptionType } from '@prisma/client';
import { SubscriptionService } from './subscription.service';
import { RequestSubscriptionDto } from './dto/request-subscription.dto';

@ApiTags('Subscription')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Get('plans')
  @ApiQuery({ name: 'type', required: false, enum: ['STUDENT', 'SCHOOL', 'SCHOOL_FEATURED'] })
  @ApiResponse({ status: 200, description: 'Active subscription plans catalog' })
  async plans(@Query('type') type?: SubscriptionType) {
    return this.subscriptionService.listPlans({ type });
  }

  @Get('entitlements')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Current user premium keys' })
  async entitlements(@Request() req) {
    return this.subscriptionService.getMyEntitlements(req.user.userId);
  }

  @Get('mine')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Current user subscription history' })
  async mine(@Request() req) {
    return this.subscriptionService.getMySubscriptions(req.user.userId);
  }

  // Manual (WhatsApp) request: records a PENDING subscription so it shows up
  // in the admin's pending-requests list.
  @Post('request')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Subscription request recorded (PENDING)' })
  async request(@Request() req, @Body() dto: RequestSubscriptionDto) {
    return this.subscriptionService.requestSubscription(req.user.userId, dto);
  }
}
