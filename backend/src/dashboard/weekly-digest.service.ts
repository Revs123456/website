import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

/**
 * Weekly Monday morning digest. Highest email open rates land on Monday
 * mornings; 9 AM IST hits the WFH and pre-standup window.
 *
 * Digest content is built per user from existing tables (XP ledger, jobs,
 * community) — no new infrastructure required.
 */
@Injectable()
export class WeeklyDigestService {
  private readonly logger = new Logger(WeeklyDigestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  @Cron('0 9 * * 1', { timeZone: 'Asia/Kolkata' }) // every Monday 9 AM IST
  async sendWeeklyDigest() {
    // Only send to users who:
    //   - opted in to email
    //   - have logged in within the last 60 days (no spam to ghosts)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const users = await this.prisma.siteUser.findMany({
      where: {
        email_opt_in: true,
        last_login_at: { gte: sixtyDaysAgo },
      },
      select: {
        id: true, email: true, name: true, target_role: true,
        xp: true, level: true, is_pro: true,
      },
    });
    if (users.length === 0) {
      this.logger.log('Weekly digest: no eligible users');
      return;
    }

    // Pull fresh-this-week jobs once and reuse across users for cheap match
    const newJobs = await this.prisma.job.findMany({
      where: { published: true, created_at: { gte: oneWeekAgo } },
      orderBy: { created_at: 'desc' },
      take: 50,
      select: { id: true, title: true, company: true, location: true, salary: true, category: true },
    });

    // Per-user fan-out with stagger to keep under Resend rate limits
    let sent = 0;
    for (const u of users) {
      try {
        // Last week's XP earnings
        const xpAgg = await this.prisma.xpEvent.aggregate({
          where: { site_user_id: u.id, created_at: { gte: oneWeekAgo } },
          _sum: { amount: true },
        });
        const weeklyXp = xpAgg._sum.amount ?? 0;

        // Current streak
        const streak = await this.prisma.userStreak.findUnique({
          where: { site_user_id: u.id },
          select: { current_streak: true },
        });

        // 3 most-relevant new jobs (very cheap text match on target role)
        const targetLower = (u.target_role || '').toLowerCase();
        const matchedJobs = newJobs
          .map(j => ({
            ...j,
            score:
              (targetLower && j.title.toLowerCase().includes(targetLower)) ? 2 :
              (targetLower && j.category?.toLowerCase().includes(targetLower)) ? 1 : 0,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        await this.mail.sendWeeklyDigest({
          email: u.email,
          name: u.name,
          weekly_xp: weeklyXp,
          current_streak: streak?.current_streak ?? 0,
          level: u.level,
          target_role: u.target_role,
          new_jobs: matchedJobs,
        });
        sent++;
      } catch (e) {
        this.logger.warn(`Weekly digest failed for ${u.id}: ${(e as Error).message}`);
      }
      // 100ms stagger to stay well under Resend's rate limit
      await new Promise(r => setTimeout(r, 100));
    }
    this.logger.log(`Weekly digest sent: ${sent}/${users.length}`);
  }
}
