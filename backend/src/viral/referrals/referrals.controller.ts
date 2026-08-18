import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ReferralsService } from './referrals.service';
import { UserJwtAuthGuard } from '../../users/guards/user-jwt.guard';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly svc: ReferralsService) {}

  /** Public — lookup who a code belongs to (used by signup form to show "Referred by Yaswanth"). */
  @Get('lookup/:code')
  async lookup(@Param('code') code: string) {
    const owner = await this.svc.findUserByCode(code);
    if (!owner) return { valid: false };
    return {
      valid: true,
      referrer: { name: owner.name, username: owner.username },
    };
  }

  /** Auth — get my code + stats. Lazy-generates code on first call. */
  @UseGuards(UserJwtAuthGuard)
  @Get('me')
  async myStats(@Req() req: Request) {
    const userId = (req as any).user.sub;
    // Ensure the code exists before returning stats — first call mints it
    await this.svc.ensureCodeFor(userId);
    return this.svc.myStats(userId);
  }
}
