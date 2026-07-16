import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';

class SubscribeDto {
  @IsString() endpoint: string;
  @IsString() p256dh: string;
  @IsString() auth: string;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationController {
  constructor(
    private service: NotificationService,
    private push: PushService
  ) {}

  @Get()
  @ApiResponse({ status: 200, description: 'List of notifications (unread first, max 50)' })
  list(@Request() req) {
    return this.service.list(req.user.userId);
  }

  @Get('unread-count')
  @ApiResponse({ status: 200, description: 'Number of unread notifications' })
  unreadCount(@Request() req) {
    return this.service.unreadCount(req.user.userId);
  }

  @Get('vapid-public-key')
  @ApiResponse({ status: 200, description: 'VAPID public key for push subscription' })
  vapidKey() {
    return { key: this.push.vapidPublicKey };
  }

  @Post('subscribe')
  @ApiResponse({ status: 201, description: 'Push subscription registered' })
  subscribe(@Request() req, @Body() dto: SubscribeDto) {
    return this.push.subscribe(req.user.userId, dto.endpoint, dto.p256dh, dto.auth);
  }

  @Delete('unsubscribe')
  @ApiResponse({ status: 200, description: 'Push subscription removed' })
  unsubscribe(@Request() req, @Body() dto: Pick<SubscribeDto, 'endpoint'>) {
    return this.push.unsubscribe(req.user.userId, dto.endpoint);
  }

  @Patch('read-all')
  @ApiResponse({ status: 200, description: 'Mark all notifications as read' })
  markAllRead(@Request() req) {
    return this.service.markAllRead(req.user.userId);
  }

  @Patch(':id/read')
  @ApiResponse({ status: 200, description: 'Mark one notification as read' })
  markRead(@Request() req, @Param('id') id: string) {
    return this.service.markRead(req.user.userId, id);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Delete a notification' })
  deleteOne(@Request() req, @Param('id') id: string) {
    return this.service.deleteOne(req.user.userId, id);
  }
}
