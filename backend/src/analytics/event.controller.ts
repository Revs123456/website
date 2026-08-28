import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { UserJwtAuthGuard } from '../users/guards/user-jwt.guard';
import { AnalyticsService } from './analytics.service';
import { LogEventDto } from './dto/log-event.dto';

// Logged-in users only — deliberately not open to anonymous callers. Every
// in-app custom event (page views, Rev widget usage) follows the same rule:
// if there's no signed-in user, GA4 is the source of truth, not this table.
@UseGuards(UserJwtAuthGuard)
@Controller('analytics/event')
export class AnalyticsEventController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @Post()
  @HttpCode(204)
  async log(@Body() dto: LogEventDto, @Req() req: Request) {
    const userId = (req as any).user.sub;
    await this.analytics.logEvent(userId, dto.session_id, dto.event_type, dto.path, dto.resource_type, dto.resource_id);
  }
}
