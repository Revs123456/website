import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { ChallengesService } from './challenges.service';
import { UserJwtAuthGuard } from '../users/guards/user-jwt.guard';
import { SubmitChallengeDto } from './dto/submit-challenge.dto';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly svc: ChallengesService) {}

  /** Public — challenge of the day. Cached at the edge would be nice
   * (24h TTL is natural) but Phase 2 keeps it simple and uncached. */
  @Get('today')
  today() {
    return this.svc.getTodaysChallenge();
  }

  /** Auth — returns user's own submission for today (null if none yet). */
  @UseGuards(UserJwtAuthGuard)
  @Get('today/my-submission')
  myToday(@Req() req: Request) {
    return this.svc.getMySubmissionForToday((req as any).user.sub);
  }

  /**
   * Auth + write — submit answer.
   * Throttled tight (3 per hour) because:
   *   1) one user gets one submission per day anyway (unique constraint),
   *   2) tighter throttle protects the AI scoring endpoint that lands in Phase 4.
   */
  @UseGuards(UserJwtAuthGuard)
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @Post(':date/submit')
  @HttpCode(200)
  submit(
    @Param('date') date: string,
    @Body() dto: SubmitChallengeDto,
    @Req() req: Request,
  ) {
    return this.svc.submit((req as any).user.sub, dto.date || date, dto.answer);
  }
}
