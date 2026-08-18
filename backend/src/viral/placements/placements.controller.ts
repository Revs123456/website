import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { PlacementsService } from './placements.service';
import { SubmitPlacementDto } from './dto/submit-placement.dto';

@Controller('placements')
export class PlacementsController {
  constructor(private readonly svc: PlacementsService) {}

  // AI call; tight throttle. 1/hour per IP is generous given the 1/week
  // dedup by name+company at the service level.
  @Post('submit')
  @HttpCode(200)
  @Throttle({ default: { ttl: 3600_000, limit: 1 } })
  async submit(@Body() dto: SubmitPlacementDto, @Req() req: Request) {
    const userId = this.extractOptionalUserId(req);
    return this.svc.submit({ dto, userId });
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
