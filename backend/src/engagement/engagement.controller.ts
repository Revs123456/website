import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { XpService } from './xp.service';
import { StreakService } from './streak.service';
import { BadgesService } from './badges.service';
import { UserJwtAuthGuard } from '../users/guards/user-jwt.guard';
import { levelProgress } from './engagement.constants';

/**
 * Read-only engagement endpoints used by the user dashboard, navbar indicator,
 * and (Phase 6) the leaderboard page.
 *
 * Writes happen via the natural event endpoints (POST /challenges/:date/submit,
 * etc.) — not through this controller.
 */
@Controller('engagement')
export class EngagementController {
  constructor(
    private readonly xp: XpService,
    private readonly streak: StreakService,
    private readonly badges: BadgesService,
  ) {}

  /** Compact snapshot for the navbar — fast call, no joins beyond user. */
  @UseGuards(UserJwtAuthGuard)
  @Get('me/summary')
  async mySummary(@Req() req: Request) {
    const userId = (req as any).user.sub;
    const [streak, recentBadges] = await Promise.all([
      this.streak.getStreak(userId),
      this.badges.listEarnedBy(userId).then(rows => rows.slice(0, 3)),
    ]);
    return { streak, recent_badges: recentBadges };
  }

  /** Full dashboard payload for the /account engagement panels. */
  @UseGuards(UserJwtAuthGuard)
  @Get('me/dashboard')
  async myDashboard(@Req() req: Request) {
    const userId = (req as any).user.sub;
    const [streak, recentXp, earnedBadges, allBadges] = await Promise.all([
      this.streak.getStreak(userId),
      this.xp.recentEvents(userId, 10),
      this.badges.listEarnedBy(userId),
      this.badges.listAll(false),
    ]);
    const earnedIds = new Set(earnedBadges.map(b => b.badge.id));
    const badgesWithStatus = allBadges.map(b => ({
      ...b,
      earned: earnedIds.has(b.id),
      earned_at: earnedBadges.find(eb => eb.badge.id === b.id)?.earned_at ?? null,
    }));
    return {
      streak,
      recent_xp: recentXp,
      badges: badgesWithStatus,
      earned_count: earnedBadges.length,
      total_count: allBadges.length,
    };
  }

  /** Recent XP earners — Phase 2 ships the API; the UI page comes in Phase 6. */
  @Get('leaderboard/weekly')
  async weeklyLeaderboard(@Query('limit') limit?: string) {
    const n = Math.min(parseInt(limit || '50', 10) || 50, 100);
    return this.xp.weeklyLeaderboard(n);
  }

  /** Level progression info — useful for marketing pages explaining the system. */
  @Get('levels')
  levels() {
    return {
      // Build the full ladder using the helper so a single source of truth defines it
      levels: Array.from({ length: 8 }, (_, i) => {
        const xp = [0, 100, 500, 1500, 3500, 7000, 15000, 30000][i];
        return levelProgress(xp);
      }),
    };
  }
}
