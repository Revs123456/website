import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AnalyticsService } from './analytics.service';
import { Ga4Service } from './ga4.service';
import { AnalyticsRangeDto, AnalyticsUsersTableDto } from './dto/analytics-range.dto';

// Admin-only — same guard every other admin resource controller uses.
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly ga4: Ga4Service,
  ) {}

  // ── Registered-user analytics (app database) ─────────────────────────────
  @Get('overview')
  overview(@Query() q: AnalyticsRangeDto) {
    return this.analytics.overview(q.range, q.start, q.end);
  }

  @Get('users-over-time')
  usersOverTime(@Query() q: AnalyticsRangeDto) {
    return this.analytics.usersOverTime(q.range, q.start, q.end);
  }

  @Get('signups-over-time')
  signupsOverTime(@Query() q: AnalyticsRangeDto) {
    return this.analytics.signupsOverTime(q.range, q.start, q.end);
  }

  @Get('sessions-over-time')
  sessionsOverTime(@Query() q: AnalyticsRangeDto) {
    return this.analytics.sessionsOverTime(q.range, q.start, q.end);
  }

  @Get('activity-by-hour')
  activityByHour(@Query() q: AnalyticsRangeDto) {
    return this.analytics.activityByHour(q.range, q.start, q.end);
  }

  @Get('activity-by-day-of-week')
  activityByDayOfWeek(@Query() q: AnalyticsRangeDto) {
    return this.analytics.activityByDayOfWeek(q.range, q.start, q.end);
  }

  @Get('retention')
  retention(@Query() q: AnalyticsRangeDto) {
    return this.analytics.retention(q.range, q.start, q.end);
  }

  @Get('revbot')
  revbot(@Query() q: AnalyticsRangeDto) {
    return this.analytics.revbotUsage(q.range, q.start, q.end);
  }

  @Get('content-engagement')
  contentEngagement(@Query() q: AnalyticsRangeDto) {
    return this.analytics.contentEngagement(q.range, q.start, q.end);
  }

  @Get('users-table')
  usersTable(@Query() q: AnalyticsUsersTableDto) {
    return this.analytics.usersTable(q.range, q.page, q.search, q.start, q.end);
  }

  @Get('export.csv')
  async exportCsv(@Query() q: AnalyticsRangeDto, @Res() res: Response) {
    const csv = await this.analytics.exportCsv(q.range, q.start, q.end);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="analytics-users-${q.range}.csv"`,
    });
    res.send(csv);
  }

  // ── Anonymous/public traffic (GA4) ───────────────────────────────────────
  @Get('traffic/overview')
  trafficOverview(@Query() q: AnalyticsRangeDto) {
    return this.ga4.overview(q.range, q.start, q.end);
  }

  @Get('traffic/by-day')
  trafficByDay(@Query() q: AnalyticsRangeDto) {
    return this.ga4.trafficByDay(q.range, q.start, q.end);
  }

  @Get('traffic/by-hour')
  trafficByHour(@Query() q: AnalyticsRangeDto) {
    return this.ga4.trafficByHour(q.range, q.start, q.end);
  }

  @Get('traffic/by-day-of-week')
  trafficByDayOfWeek(@Query() q: AnalyticsRangeDto) {
    return this.ga4.trafficByDayOfWeek(q.range, q.start, q.end);
  }
}
