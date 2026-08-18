import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ActivityFeedService } from './activity-feed.service';
import { UserJwtAuthGuard } from '../users/guards/user-jwt.guard';

@Controller('activity')
export class ActivityFeedController {
  constructor(private readonly svc: ActivityFeedService) {}

  /** Public — homepage / dashboard pulls a short feed for the "what's happening" panel. */
  @Get('public')
  publicFeed(@Query('limit') limit?: string) {
    return this.svc.publicFeed(limit ? Math.min(parseInt(limit, 10) || 30, 100) : 30);
  }

  /** My personal feed — includes private events. */
  @UseGuards(UserJwtAuthGuard)
  @Get('me')
  myFeed(@Req() req: Request, @Query('limit') limit?: string) {
    return this.svc.myFeed(
      (req as any).user.sub,
      limit ? Math.min(parseInt(limit, 10) || 30, 100) : 30,
    );
  }
}
