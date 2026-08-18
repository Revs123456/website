import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UsageLimitsService } from './usage-limits.service';
import { UserJwtAuthGuard } from '../users/guards/user-jwt.guard';

@Controller('usage')
export class UsageLimitsController {
  constructor(private readonly limits: UsageLimitsService) {}

  /** Per-feature used/limit/remaining — drives the /account "AI Usage" panel. */
  @UseGuards(UserJwtAuthGuard)
  @Get('me')
  myUsage(@Req() req: Request) {
    return this.limits.getDashboard((req as any).user.sub);
  }
}
