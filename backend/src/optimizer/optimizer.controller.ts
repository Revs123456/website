import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { OptimizerService } from './optimizer.service';
import { OptimizeResumeDto } from './dto/optimize.dto';
import { UserJwtAuthGuard } from '../users/guards/user-jwt.guard';

@Controller('optimizer')
export class OptimizerController {
  constructor(private readonly svc: OptimizerService) {}

  // Auth required — Phase 4 features link to user accounts.
  // Throttle prevents UI-bug retry storms (DB-level day cap is in UsageLimitsService).
  @UseGuards(UserJwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 2 } })
  @Post()
  @HttpCode(200)
  optimize(@Body() dto: OptimizeResumeDto, @Req() req: Request) {
    return this.svc.optimize({
      userId: (req as any).user.sub,
      resumeText: dto.resume_text,
      jdText: dto.jd_text,
    });
  }

  /** Owners get full data; share-token-only viewers get the result without the source resume. */
  @Get(':token')
  get(@Param('token') token: string, @Req() req: Request) {
    const viewerId = this.extractOptionalUserId(req);
    return this.svc.getByToken(token, viewerId);
  }

  /** History — used by /account "My Optimizations" panel. */
  @UseGuards(UserJwtAuthGuard)
  @Get()
  listMine(@Req() req: Request) {
    return this.svc.listMine((req as any).user.sub);
  }

  private extractOptionalUserId(req: Request): string | null {
    try {
      const cookieToken = (req as any).cookies?.tch_user_token;
      if (!cookieToken) return null;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const jwt = require('jsonwebtoken');
      const payload = jwt.verify(cookieToken, process.env.JWT_SECRET || '');
      return payload?.role === 'user' ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
