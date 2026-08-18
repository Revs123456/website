import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { UserJwtAuthGuard } from '../users/guards/user-jwt.guard';

@UseGuards(UserJwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  /** One-shot aggregated payload for /dashboard. */
  @Get('me')
  myDashboard(@Req() req: Request) {
    return this.svc.getDashboard((req as any).user.sub);
  }
}
