import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { LEVEL_NAMES, levelProgress } from '../engagement/engagement.constants';

/**
 * Aggregates everything the /dashboard page needs into ONE response.
 * Replaces N+1 round-trips with a single network call after auth hydration.
 *
 * Each section is independently fetched in parallel so a single slow query
 * doesn't block the others.
 */
@Injectable()
export class DashboardService {
  // Phase 7 — 30s cache. Counters can be 30s stale without anyone noticing;
  // the heavy aggregation is the cost we're avoiding.
  private readonly CACHE_TTL_SECONDS = 30;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly cache?: CacheService,
  ) {}

  async getDashboard(userId: string) {
    // Cache-through: most repeat hits during a session land here within 30s.
    if (this.cache) {
      return this.cache.wrap(`dashboard:${userId}`, this.CACHE_TTL_SECONDS, () => this.computeDashboard(userId));
    }
    return this.computeDashboard(userId);
  }

  private async computeDashboard(userId: string) {
    const user = await this.prisma.siteUser.findUnique({
      where: { id: userId },
      include: {
        streak: { select: { current_streak: true, longest_streak: true, last_activity_date: true, shields_remaining: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      unreadNotifications,
      savedJobs,
      activeApplications,
      upcomingFollowUps,
      weeklyXp,
      recentBadges,
      myRecentActivity,
      publicActivity,
      unsolvedQuestions,
    ] = await Promise.all([
      // Unread notifications count for the bell
      this.prisma.notification.count({ where: { site_user_id: userId, read: false } }),

      // Top 5 most recently saved jobs
      this.prisma.savedJob.findMany({
        where: { site_user_id: userId },
        orderBy: { saved_at: 'desc' },
        take: 5,
        include: { job: { select: { id: true, title: true, company: true, location: true, salary: true } } },
      }),

      // Currently-active applications across non-terminal statuses
      this.prisma.jobApplication.findMany({
        where: { site_user_id: userId, status: { in: ['applied', 'interview', 'offer'] } },
        orderBy: { updated_at: 'desc' },
        take: 8,
        select: { id: true, company: true, role: true, status: true, applied_at: true, next_follow_up: true },
      }),

      // Follow-ups due in the next 7 days
      this.prisma.jobApplication.findMany({
        where: {
          site_user_id: userId,
          next_follow_up: {
            gte: new Date(),
            lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { next_follow_up: 'asc' },
        take: 5,
        select: { id: true, company: true, role: true, next_follow_up: true },
      }),

      // XP earned in the last 7 days (rolling)
      this.prisma.xpEvent.aggregate({
        where: { site_user_id: userId, created_at: { gte: sevenDaysAgo } },
        _sum: { amount: true },
      }),

      // 3 most-recently earned badges for a marquee strip
      this.prisma.userBadge.findMany({
        where: { site_user_id: userId },
        orderBy: { earned_at: 'desc' },
        take: 3,
        include: { badge: { select: { code: true, name: true, icon: true, tier: true } } },
      }),

      // My own recent activity for the "Your week" panel
      this.prisma.activityEvent.findMany({
        where: { site_user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 8,
      }),

      // Global feed snippet for the "Community pulse" panel — public events only
      this.prisma.activityEvent.findMany({
        where: { is_public: true, user: { profile_public: true } },
        orderBy: { created_at: 'desc' },
        take: 8,
        include: {
          user: { select: { username: true, name: true, level: true, is_pro: true } },
        },
      }),

      // Latest unsolved community questions — engagement bait
      this.prisma.communityQuestion.findMany({
        where: { published: true, solved: false },
        orderBy: { created_at: 'desc' },
        take: 4,
        select: { id: true, title: true, tags: true, answers_count: true, votes_count: true, created_at: true },
      }),
    ]);

    const prog = levelProgress(user.xp);

    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        is_pro: user.is_pro,
        xp: user.xp,
        level: user.level,
        level_name: LEVEL_NAMES[Math.max(0, Math.min(user.level - 1, LEVEL_NAMES.length - 1))],
        progress: prog,
      },
      streak: user.streak ?? { current_streak: 0, longest_streak: 0, last_activity_date: null, shields_remaining: 0 },
      counters: {
        unread_notifications: unreadNotifications,
        saved_jobs: savedJobs.length,
        active_applications: activeApplications.length,
        upcoming_follow_ups: upcomingFollowUps.length,
        weekly_xp: weeklyXp._sum.amount ?? 0,
      },
      saved_jobs: savedJobs,
      active_applications: activeApplications,
      upcoming_follow_ups: upcomingFollowUps,
      recent_badges: recentBadges,
      my_recent_activity: myRecentActivity,
      public_activity: publicActivity,
      unsolved_questions: unsolvedQuestions,
    };
  }
}
