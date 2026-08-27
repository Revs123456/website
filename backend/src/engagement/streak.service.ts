import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { XpService } from './xp.service';
import {
  daysBetween, istTodayDate, istYesterdayDate,
  STREAK_MILESTONES,
} from './engagement.constants';

export type TouchStreakResult = {
  /** True only on the first call of the IST day. False on subsequent calls. */
  changed: boolean;
  current_streak: number;
  longest_streak: number;
  /** Set to N when this touch hit the N-day milestone. */
  milestone_hit: number | null;
  /** XP awarded for milestone (0 if no milestone). */
  milestone_xp: number;
  /** True if a shield was burned to cover a missed day. */
  shield_used: boolean;
};

@Injectable()
export class StreakService {
  private readonly logger = new Logger(StreakService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly xp: XpService,
    private readonly mail: MailService,
  ) {}

  /**
   * 8 PM IST cron — find users whose streak is at risk (active yesterday but
   * not today) AND opted into email and send a reminder.
   *
   * Sent sequentially with a tiny stagger so we don't burst the Resend API
   * if the at-risk list ever gets large. Resend free tier handles ~14/sec
   * comfortably; 100ms = 10/sec is well under.
   */
  @Cron('0 20 * * *', { timeZone: 'Asia/Kolkata' })
  async sendStreakReminders(): Promise<void> {
    const atRisk = await this.findUsersAtRisk();
    const eligible = atRisk.filter(s => s.user.email_opt_in && s.user.email);
    if (eligible.length === 0) {
      this.logger.log('No streak reminders to send today');
      return;
    }

    this.logger.log(`Sending streak reminders to ${eligible.length} users`);
    let sent = 0;
    for (const row of eligible) {
      try {
        await this.mail.sendStreakReminder({
          email: row.user.email!,
          name: row.user.name,
          current_streak: row.current_streak,
        });
        sent++;
      } catch (e) {
        this.logger.warn(`Streak reminder failed for ${row.site_user_id}`, e as Error);
      }
      // Stagger
      await new Promise(r => setTimeout(r, 100));
    }
    this.logger.log(`Streak reminders sent: ${sent}/${eligible.length}`);
  }

  /**
   * Idempotent per IST day. Call whenever the user does a qualifying activity
   * (Phase 2: only daily challenge submission counts; Phase 3+ can wire more).
   *
   * Rules:
   *   - Same IST day as last touch → no-op, returns current streak unchanged.
   *   - Touched yesterday → continue streak (++).
   *   - Touched > 1 day ago AND shields_remaining > 0 → burn 1 shield, continue.
   *   - Touched > 1 day ago AND no shields → reset to 1.
   *   - Never touched → start at 1.
   *
   * Hitting a milestone (3/7/14/30/...) awards bonus XP via XpService with
   * an idempotency key — same-streak duplicate calls won't double-award.
   */
  async touchStreak(userId: string, tx?: Prisma.TransactionClient): Promise<TouchStreakResult> {
    const run = async (db: Prisma.TransactionClient): Promise<TouchStreakResult> => {
      const today = istTodayDate();
      const yesterday = istYesterdayDate();

      // Upsert pattern — creates the row on first touch ever for this user.
      const existing = await db.userStreak.findUnique({ where: { site_user_id: userId } });

      // Same day → no-op (this is the hot path; keep it cheap)
      if (existing?.last_activity_date === today) {
        return {
          changed: false,
          current_streak: existing.current_streak,
          longest_streak: existing.longest_streak,
          milestone_hit: null,
          milestone_xp: 0,
          shield_used: false,
        };
      }

      let nextStreak: number;
      let shieldUsed = false;
      let shieldsRemaining = existing?.shields_remaining ?? 0;
      let shieldsUsedTotal = existing?.shields_used_total ?? 0;

      if (!existing || !existing.last_activity_date) {
        // First-ever activity
        nextStreak = 1;
      } else if (existing.last_activity_date === yesterday) {
        // Perfect continuation
        nextStreak = existing.current_streak + 1;
      } else {
        const gap = daysBetween(existing.last_activity_date, today);
        // gap >= 2 means at least one day was missed (gap=1 would have hit the
        // yesterday branch). One shield covers any size gap, since users
        // shouldn't be punished for vacations beyond their available shield.
        if (gap >= 2 && shieldsRemaining > 0) {
          nextStreak = existing.current_streak + 1;
          shieldsRemaining -= 1;
          shieldsUsedTotal += 1;
          shieldUsed = true;
        } else {
          nextStreak = 1;
        }
      }

      const nextLongest = Math.max(existing?.longest_streak ?? 0, nextStreak);

      await db.userStreak.upsert({
        where: { site_user_id: userId },
        create: {
          site_user_id: userId,
          current_streak: nextStreak,
          longest_streak: nextLongest,
          last_activity_date: today,
          shields_remaining: shieldsRemaining,
          shields_used_total: shieldsUsedTotal,
        },
        update: {
          current_streak: nextStreak,
          longest_streak: nextLongest,
          last_activity_date: today,
          shields_remaining: shieldsRemaining,
          shields_used_total: shieldsUsedTotal,
        },
      });

      // Milestone XP retired — streak milestones no longer pay out (only
      // signup, profile completion, daily login, and referrals do). Still
      // detect the milestone itself: `milestone_hit` drives non-XP UI (e.g.
      // a "you hit 7 days!" moment) and STREAK_MILESTONES backs
      // `next_milestone` in getStreak() below.
      const milestone = STREAK_MILESTONES.find(m => m.days === nextStreak);
      const milestoneXp = 0;

      return {
        changed: true,
        current_streak: nextStreak,
        longest_streak: nextLongest,
        milestone_hit: milestone ? milestone.days : null,
        milestone_xp: milestoneXp,
        shield_used: shieldUsed,
      };
    };

    if (tx) return run(tx);
    return this.prisma.$transaction(run);
  }

  async getStreak(userId: string) {
    const streak = await this.prisma.userStreak.findUnique({ where: { site_user_id: userId } });
    const today = istTodayDate();
    const yesterday = istYesterdayDate();

    if (!streak) {
      return {
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        shields_remaining: 0,
        active_today: false,
        // "at_risk" → user has a streak going but hasn't touched it today.
        // Drives the navbar flame to pulse red and the 8 PM reminder email.
        at_risk: false,
        next_milestone: STREAK_MILESTONES[0],
      };
    }

    const activeToday = streak.last_activity_date === today;
    const atRisk = !activeToday && streak.current_streak > 0 && streak.last_activity_date === yesterday;
    const next = STREAK_MILESTONES.find(m => m.days > streak.current_streak) ?? null;

    return {
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      last_activity_date: streak.last_activity_date,
      shields_remaining: streak.shields_remaining,
      active_today: activeToday,
      at_risk: atRisk,
      next_milestone: next,
    };
  }

  /** Used by the 8 PM IST cron to find users whose streaks need a reminder. */
  async findUsersAtRisk() {
    const yesterday = istYesterdayDate();
    return this.prisma.userStreak.findMany({
      where: {
        current_streak: { gt: 0 },
        last_activity_date: yesterday,  // active yesterday → didn't touch today yet
      },
      include: {
        user: { select: { id: true, email: true, name: true, email_opt_in: true } },
      },
    });
  }
}
