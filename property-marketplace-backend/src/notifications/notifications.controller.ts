// Backend: notifications/notifications.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
  Body
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { Roles } from 'src/auth/roles.decorator';


@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(
    @Req() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    const result = await this.notificationsService.getUserNotifications(
      req.user.userId,
      parseInt(page),
      parseInt(limit)
    );

    return {
      status: 'success',
      data: result.notifications,
      pagination: result.pagination
    };
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.userId);
    return {
      status: 'success',
      count
    };
  }

  @Patch(':notificationId/mark-read')
  async markAsRead(@Param('notificationId') notificationId: string, @Req() req) {
    await this.notificationsService.markAsRead(
      parseInt(notificationId),
      req.user.userId
    );

    return {
      status: 'success',
      message: 'Notification marked as read'
    };
  }

  @Patch('mark-all-read')
  async markAllAsRead(@Req() req) {
    await this.notificationsService.markAllAsRead(req.user.userId);

    return {
      status: 'success',
      message: 'All notifications marked as read'
    };
  }

  // Admin endpoint to send system announcements
  @Roles('SUPER_ADMIN', 'ADMIN', 'DISPUTE_RESOLVER','ESCROW_MANAGER')
  @Post('system-announcement')
  async createSystemAnnouncement(
    @Body() body: { userIds: number[]; title: string; message: string },
    @Req() req
  ) {
    // You might want to add role-based guards here for admin-only access
    await this.notificationsService.createSystemAnnouncement(
      body.userIds,
      body.title,
      body.message
    );

    return {
      status: 'success',
      message: 'System announcement sent'
    };
  }
}