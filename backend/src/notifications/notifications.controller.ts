import { Controller, Get, HttpCode, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { UserJwtAuthGuard } from '../users/guards/user-jwt.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @UseGuards(UserJwtAuthGuard)
  @Get()
  list(@Req() req: Request, @Query('limit') limit?: string) {
    return this.svc.listMine(
      (req as any).user.sub,
      limit ? Math.min(parseInt(limit, 10) || 50, 100) : 50,
    );
  }

  /** Cheap endpoint — polled every 30s by the navbar bell. */
  @UseGuards(UserJwtAuthGuard)
  @Get('unread-count')
  async unreadCount(@Req() req: Request) {
    const count = await this.svc.unreadCount((req as any).user.sub);
    return { count };
  }

  @UseGuards(UserJwtAuthGuard)
  @Post(':id/read')
  @HttpCode(200)
  markRead(@Param('id') id: string, @Req() req: Request) {
    return this.svc.markRead((req as any).user.sub, id);
  }

  @UseGuards(UserJwtAuthGuard)
  @Post('mark-all-read')
  @HttpCode(200)
  markAllRead(@Req() req: Request) {
    return this.svc.markAllRead((req as any).user.sub);
  }
}
