import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { resolveDateRange, pctChange, RangeKey } from './date-range.util';

// ═══════════════════════════════════════════════════════════════════════════
// Registered-user analytics, computed entirely from existing app data:
//
//   - "Active user" / login history  → XpEvent(reason='daily_login')
//     (idempotent one-row-per-user-per-IST-day, fired from GET /users/me on
//     every app load — see users.service.ts#getMeWithEngagement). This is
//     the closest thing this app has to a login-event log, and it's already
//     exactly the right shape for DAU/WAU/MAU.
//   - Sessions / page views / content views → AnalyticsEvent (new table,
//     this feature). Anonymous visitors are NOT in this table — GA4 owns that.
//   - Signups            → SiteUser.created_at
//   - RevBot usage        → AiUsage(feature='revbot')
//   - Job engagement      → SavedJob, JobApplication
//   - Course/roadmap views → AnalyticsEvent(resource_type='course'|'roadmap')
//
// Every method here is scoped to registered users only — see ga4.service.ts
// for the anonymous/public-traffic half of the dashboard.
// ═══════════════════════════════════════════════════════════════════════════
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private range(range: RangeKey, start?: string, end?: string) {
    return resolveDateRange(range, start, end);
  }

  // ── Overview KPI cards ──────────────────────────────────────────────────
  async overview(rangeKey: RangeKey, start?: string, end?: string) {
    const { start: s, end: e, previousStart, previousEnd } = this.range(rangeKey, start, end);

    const [totalUsers, newUsers, prevNewUsers, activeUserRows, prevActiveUserRows, sessions, prevSessions] =
      await Promise.all([
        this.prisma.siteUser.count({ where: { created_at: { lt: e } } }),
        this.prisma.siteUser.count({ where: { created_at: { gte: s, lt: e } } }),
        this.prisma.siteUser.count({ where: { created_at: { gte: previousStart, lt: previousEnd } } }),
        this.distinctActiveUserIds(s, e),
        this.distinctActiveUserIds(previousStart, previousEnd),
        this.sessionize(s, e),
        this.sessionize(previousStart, previousEnd),
      ]);

    const activeUsers = activeUserRows.length;
    const prevActiveUsers = prevActiveUserRows.length;

    // Returning = active in this period AND signed up before it started.
    const activeSet = new Set(activeUserRows);
    const returningUsers = activeSet.size
      ? await this.prisma.siteUser.count({
          where: { id: { in: [...activeSet] }, created_at: { lt: s } },
        })
      : 0;
    const prevActiveSet = new Set(prevActiveUserRows);
    const prevReturningUsers = prevActiveSet.size
      ? await this.prisma.siteUser.count({
          where: { id: { in: [...prevActiveSet] }, created_at: { lt: previousStart } },
        })
      : 0;

    const avgSessionSeconds = sessions.length
      ? Math.round(sessions.reduce((sum, x) => sum + x.durationSeconds, 0) / sessions.length)
      : 0;
    const prevAvgSessionSeconds = prevSessions.length
      ? Math.round(prevSessions.reduce((sum, x) => sum + x.durationSeconds, 0) / prevSessions.length)
      : 0;

    return {
      range: { start: s, end: e },
      metrics: {
        total_users:      { value: totalUsers, source: 'app_db' },
        new_users:        { value: newUsers, change_pct: pctChange(newUsers, prevNewUsers), source: 'app_db' },
        returning_users:  { value: returningUsers, change_pct: pctChange(returningUsers, prevReturningUsers), source: 'app_db' },
        active_users:     { value: activeUsers, change_pct: pctChange(activeUsers, prevActiveUsers), source: 'app_db' },
        signups:          { value: newUsers, change_pct: pctChange(newUsers, prevNewUsers), source: 'app_db' },
        total_sessions:   { value: sessions.length, change_pct: pctChange(sessions.length, prevSessions.length), source: 'app_db' },
        avg_session_seconds: { value: avgSessionSeconds, change_pct: pctChange(avgSessionSeconds, prevAvgSessionSeconds), source: 'app_db' },
      },
    };
  }

  /** Distinct site_user_id with ≥1 daily_login XP event in [start, end). */
  private async distinctActiveUserIds(start: Date, end: Date): Promise<string[]> {
    const rows = await this.prisma.xpEvent.findMany({
      where: { reason: 'daily_login', created_at: { gte: start, lt: end } },
      select: { site_user_id: true },
      distinct: ['site_user_id'],
    });
    return rows.map(r => r.site_user_id);
  }

  /** Groups AnalyticsEvent rows into (user, session_id) sessions with first/last/duration/pageCount. */
  private async sessionize(start: Date, end: Date) {
    const groups = await this.prisma.analyticsEvent.groupBy({
      by: ['site_user_id', 'session_id'],
      where: { created_at: { gte: start, lt: end } },
      _min: { created_at: true },
      _max: { created_at: true },
      _count: { _all: true },
    });
    return groups.map(g => ({
      siteUserId: g.site_user_id,
      sessionId: g.session_id,
      pageViews: g._count._all,
      durationSeconds: g._min.created_at && g._max.created_at
        ? Math.max(0, Math.round((g._max.created_at.getTime() - g._min.created_at.getTime()) / 1000))
        : 0,
    }));
  }

  // ── Users over time (new vs returning, daily) ───────────────────────────
  async usersOverTime(rangeKey: RangeKey, start?: string, end?: string) {
    const { start: s, end: e } = this.range(rangeKey, start, end);

    const newByDay = await this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', created_at AT TIME ZONE 'Asia/Kolkata') AS day, COUNT(*)::bigint AS count
      FROM site_users
      WHERE created_at >= ${s} AND created_at < ${e}
      GROUP BY 1 ORDER BY 1
    `;
    const activeByDay = await this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', created_at AT TIME ZONE 'Asia/Kolkata') AS day, COUNT(DISTINCT site_user_id)::bigint AS count
      FROM xp_events
      WHERE reason = 'daily_login' AND created_at >= ${s} AND created_at < ${e}
      GROUP BY 1 ORDER BY 1
    `;

    const newMap = new Map(newByDay.map(r => [r.day.toISOString().slice(0, 10), Number(r.count)]));
    const activeMap = new Map(activeByDay.map(r => [r.day.toISOString().slice(0, 10), Number(r.count)]));
    const days = this.enumerateDays(s, e);

    return days.map(day => {
      const newUsers = newMap.get(day) || 0;
      const active = activeMap.get(day) || 0;
      return { date: day, new_users: newUsers, returning_users: Math.max(0, active - newUsers), active_users: active };
    });
  }

  private enumerateDays(start: Date, end: Date): string[] {
    const out: string[] = [];
    const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    const stop = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
    while (cur <= stop) {
      out.push(cur.toISOString().slice(0, 10));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return out;
  }

  // ── Signups over time ────────────────────────────────────────────────────
  async signupsOverTime(rangeKey: RangeKey, start?: string, end?: string) {
    const { start: s, end: e } = this.range(rangeKey, start, end);
    const rows = await this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', created_at AT TIME ZONE 'Asia/Kolkata') AS day, COUNT(*)::bigint AS count
      FROM site_users
      WHERE created_at >= ${s} AND created_at < ${e}
      GROUP BY 1 ORDER BY 1
    `;
    const map = new Map(rows.map(r => [r.day.toISOString().slice(0, 10), Number(r.count)]));
    return this.enumerateDays(s, e).map(day => ({ date: day, signups: map.get(day) || 0 }));
  }

  // ── Sessions over time ───────────────────────────────────────────────────
  async sessionsOverTime(rangeKey: RangeKey, start?: string, end?: string) {
    const { start: s, end: e } = this.range(rangeKey, start, end);
    const rows = await this.prisma.$queryRaw<{ day: Date; sessions: bigint; avg_seconds: number | null }[]>`
      SELECT
        date_trunc('day', first_seen AT TIME ZONE 'Asia/Kolkata') AS day,
        COUNT(*)::bigint AS sessions,
        AVG(EXTRACT(EPOCH FROM (last_seen - first_seen))) AS avg_seconds
      FROM (
        SELECT site_user_id, session_id, MIN(created_at) AS first_seen, MAX(created_at) AS last_seen
        FROM analytics_events
        WHERE created_at >= ${s} AND created_at < ${e}
        GROUP BY site_user_id, session_id
      ) sess
      GROUP BY 1 ORDER BY 1
    `;
    const map = new Map(rows.map(r => [
      r.day.toISOString().slice(0, 10),
      { sessions: Number(r.sessions), avg_seconds: r.avg_seconds ? Math.round(r.avg_seconds) : 0 },
    ]));
    return this.enumerateDays(s, e).map(day => ({
      date: day,
      sessions: map.get(day)?.sessions || 0,
      avg_session_seconds: map.get(day)?.avg_seconds || 0,
    }));
  }

  // ── Registered-user activity by hour / day-of-week ──────────────────────
  // Complements (doesn't replace) GA4's traffic-by-hour, which includes
  // anonymous visitors. This slice answers "when are *signed-in* users active".
  async activityByHour(rangeKey: RangeKey, start?: string, end?: string) {
    const { start: s, end: e } = this.range(rangeKey, start, end);
    const rows = await this.prisma.$queryRaw<{ hour: number; count: bigint }[]>`
      SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Kolkata')::int AS hour, COUNT(*)::bigint AS count
      FROM analytics_events
      WHERE created_at >= ${s} AND created_at < ${e} AND event_type = 'page_view'
      GROUP BY 1 ORDER BY 1
    `;
    const map = new Map(rows.map(r => [r.hour, Number(r.count)]));
    return Array.from({ length: 24 }, (_, hour) => ({ hour, count: map.get(hour) || 0 }));
  }

  async activityByDayOfWeek(rangeKey: RangeKey, start?: string, end?: string) {
    const { start: s, end: e } = this.range(rangeKey, start, end);
    const rows = await this.prisma.$queryRaw<{ dow: number; count: bigint }[]>`
      SELECT EXTRACT(DOW FROM created_at AT TIME ZONE 'Asia/Kolkata')::int AS dow, COUNT(*)::bigint AS count
      FROM analytics_events
      WHERE created_at >= ${s} AND created_at < ${e} AND event_type = 'page_view'
      GROUP BY 1 ORDER BY 1
    `;
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map = new Map(rows.map(r => [r.dow, Number(r.count)]));
    return labels.map((label, dow) => ({ day: label, count: map.get(dow) || 0 }));
  }

  // ── Retention (cohort by signup week, activity via daily_login) ─────────
  async retention(rangeKey: RangeKey, start?: string, end?: string) {
    const { start: s, end: e } = this.range(rangeKey, start, end);
    const cohort = await this.prisma.siteUser.findMany({
      where: { created_at: { gte: s, lt: e } },
      select: { id: true, created_at: true },
    });
    if (cohort.length === 0) {
      return { cohort_size: 0, day1: null, day7: null, day30: null, note: 'No signups in this range yet.' };
    }

    const now = new Date();
    const compute = async (offsetDays: number) => {
      // Only count cohort members for whom offsetDays has actually elapsed —
      // otherwise "Day 30 retention" for someone who signed up 3 days ago is
      // meaningless, not just "0%". Per the spec: don't show numbers we can't
      // back yet.
      const eligible = cohort.filter(u => now.getTime() - u.created_at.getTime() >= offsetDays * 86_400_000);
      if (eligible.length === 0) return null;

      const returned = await this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT xe.site_user_id)::bigint AS count
        FROM xp_events xe
        JOIN site_users su ON su.id = xe.site_user_id
        WHERE xe.reason = 'daily_login'
          AND su.id = ANY(${eligible.map(u => u.id)}::uuid[])
          AND xe.created_at >= su.created_at + (${offsetDays} || ' days')::interval
          AND xe.created_at <  su.created_at + (${offsetDays + 1} || ' days')::interval
      `;
      return { eligible: eligible.length, returned: Number(returned[0]?.count || 0), pct: Math.round((Number(returned[0]?.count || 0) / eligible.length) * 1000) / 10 };
    };

    const [day1, day7, day30] = await Promise.all([compute(1), compute(7), compute(30)]);
    return { cohort_size: cohort.length, day1, day7, day30, source: 'app_db' };
  }

  // ── RevBot (logged-in AI chat) usage ─────────────────────────────────────
  async revbotUsage(rangeKey: RangeKey, start?: string, end?: string) {
    const { start: s, end: e, previousStart, previousEnd } = this.range(rangeKey, start, end);
    const [messages, prevMessages, uniqueRows, trend] = await Promise.all([
      this.prisma.aiUsage.count({ where: { feature: 'revbot', created_at: { gte: s, lt: e } } }),
      this.prisma.aiUsage.count({ where: { feature: 'revbot', created_at: { gte: previousStart, lt: previousEnd } } }),
      this.prisma.aiUsage.findMany({
        where: { feature: 'revbot', created_at: { gte: s, lt: e }, site_user_id: { not: null } },
        select: { site_user_id: true }, distinct: ['site_user_id'],
      }),
      this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT date_trunc('day', created_at AT TIME ZONE 'Asia/Kolkata') AS day, COUNT(*)::bigint AS count
        FROM ai_usage WHERE feature = 'revbot' AND created_at >= ${s} AND created_at < ${e}
        GROUP BY 1 ORDER BY 1
      `,
    ]);
    const map = new Map(trend.map(r => [r.day.toISOString().slice(0, 10), Number(r.count)]));
    return {
      total_messages: { value: messages, change_pct: pctChange(messages, prevMessages), source: 'app_db' },
      unique_users: { value: uniqueRows.length, source: 'app_db' },
      widget_events: await this.widgetBeaconCounts(s, e),
      trend: this.enumerateDays(s, e).map(day => ({ date: day, messages: map.get(day) || 0 })),
    };
  }

  private async widgetBeaconCounts(s: Date, e: Date) {
    const [opened, messaged] = await Promise.all([
      this.prisma.analyticsEvent.count({ where: { event_type: 'revbot_widget_opened', created_at: { gte: s, lt: e } } }),
      this.prisma.analyticsEvent.count({ where: { event_type: 'revbot_widget_message', created_at: { gte: s, lt: e } } }),
    ]);
    return { opened, messages_sent: messaged, source: 'app_db', note: 'Floating public-page widget only; logged-in users only (anonymous widget usage is not tracked in-app).' };
  }

  // ── Content engagement ───────────────────────────────────────────────────
  async contentEngagement(rangeKey: RangeKey, start?: string, end?: string) {
    const { start: s, end: e } = this.range(rangeKey, start, end);

    const [savedJobs, appliedCompanies, viewedCourses, viewedRoadmapPages] = await Promise.all([
      this.prisma.$queryRaw<{ id: string; title: string; company: string; count: bigint }[]>`
        SELECT j.id, j.title, j.company, COUNT(*)::bigint AS count
        FROM saved_jobs sj JOIN jobs j ON j.id = sj.job_id
        WHERE sj.saved_at >= ${s} AND sj.saved_at < ${e}
        GROUP BY j.id, j.title, j.company ORDER BY count DESC LIMIT 10
      `,
      this.prisma.$queryRaw<{ company: string; count: bigint }[]>`
        SELECT company, COUNT(*)::bigint AS count FROM job_applications
        WHERE created_at >= ${s} AND created_at < ${e}
        GROUP BY company ORDER BY count DESC LIMIT 10
      `,
      this.prisma.$queryRaw<{ id: string; title: string; count: bigint }[]>`
        SELECT c.id, c.title, COUNT(*)::bigint AS count
        FROM analytics_events ae JOIN courses c ON c.id = ae.resource_id
        WHERE ae.resource_type = 'course' AND ae.created_at >= ${s} AND ae.created_at < ${e}
        GROUP BY c.id, c.title ORDER BY count DESC LIMIT 10
      `,
      this.prisma.analyticsEvent.count({
        where: { resource_type: 'roadmap', created_at: { gte: s, lt: e } },
      }),
    ]);

    return {
      most_saved_jobs: { rows: savedJobs.map(r => ({ id: r.id, label: `${r.title} @ ${r.company}`, count: Number(r.count) })), source: 'app_db (SavedJob)' },
      most_applied_companies: { rows: appliedCompanies.map(r => ({ label: r.company, count: Number(r.count) })), source: 'app_db (JobApplication)' },
      most_viewed_courses: { rows: viewedCourses.map(r => ({ id: r.id, label: r.title, count: Number(r.count) })), source: 'app_db (AnalyticsEvent)' },
      roadmap_page_views: { value: viewedRoadmapPages, source: 'app_db (AnalyticsEvent)', note: 'Roadmaps are one listing page, not individual detail routes — this is total /roadmaps page views, not per-roadmap.' },
    };
  }

  // ── Log a client-side event (page view / Rev widget) ─────────────────────
  logEvent(siteUserId: string, sessionId: string, eventType: string, path: string, resourceType?: string, resourceId?: string) {
    return this.prisma.analyticsEvent.create({
      data: { site_user_id: siteUserId, session_id: sessionId, event_type: eventType, path, resource_type: resourceType, resource_id: resourceId },
    });
  }

  // ── Detailed per-user table ──────────────────────────────────────────────
  async usersTable(rangeKey: RangeKey, page: number, search?: string, start?: string, end?: string) {
    const { start: s, end: e } = this.range(rangeKey, start, end);
    const take = 25;
    const skip = (page - 1) * take;

    const where = search
      ? { OR: [{ email: { contains: search, mode: 'insensitive' as const } }, { name: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.siteUser.findMany({ where, orderBy: { created_at: 'desc' }, skip, take,
        select: { id: true, email: true, name: true, created_at: true, last_login_at: true } }),
      this.prisma.siteUser.count({ where }),
    ]);
    if (users.length === 0) return { rows: [], total, page, page_size: take };

    const ids = users.map(u => u.id);
    const [sessionRows, revbotRows, loginCounts] = await Promise.all([
      this.prisma.$queryRaw<{ site_user_id: string; sessions: bigint; total_seconds: number | null }[]>`
        SELECT site_user_id, COUNT(*)::bigint AS sessions, SUM(EXTRACT(EPOCH FROM (last_seen - first_seen))) AS total_seconds
        FROM (
          SELECT site_user_id, session_id, MIN(created_at) AS first_seen, MAX(created_at) AS last_seen
          FROM analytics_events WHERE site_user_id = ANY(${ids}::uuid[])
          GROUP BY site_user_id, session_id
        ) sess GROUP BY site_user_id
      `,
      this.prisma.aiUsage.groupBy({ by: ['site_user_id'], where: { feature: 'revbot', site_user_id: { in: ids } }, _count: { _all: true } }),
      this.prisma.xpEvent.groupBy({ by: ['site_user_id'], where: { reason: 'daily_login', site_user_id: { in: ids } }, _count: { _all: true } }),
    ]);
    const sessionMap = new Map(sessionRows.map(r => [r.site_user_id, r]));
    const revbotMap = new Map(revbotRows.map(r => [r.site_user_id, r._count._all]));
    const loginMap = new Map(loginCounts.map(r => [r.site_user_id, r._count._all]));

    const rows = users.map(u => {
      const sess = sessionMap.get(u.id);
      const sessions = sess ? Number(sess.sessions) : 0;
      const totalSeconds = sess?.total_seconds ? Math.round(sess.total_seconds) : 0;
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        signup_date: u.created_at,
        last_active: u.last_login_at,
        login_days: loginMap.get(u.id) || 0,
        total_sessions: sessions,
        total_session_seconds: totalSeconds,
        avg_session_seconds: sessions ? Math.round(totalSeconds / sessions) : 0,
        revbot_messages: revbotMap.get(u.id) || 0,
      };
    });

    return { rows, total, page, page_size: take, source: 'app_db' };
  }

  async exportCsv(rangeKey: RangeKey, start?: string, end?: string): Promise<string> {
    const { rows } = await this.usersTable(rangeKey, 1, undefined, start, end);
    // usersTable is paginated at 25 — export needs the full set, capped generously.
    const all: any[] = [];
    let page = 1;
    while (true) {
      const { rows: batch, total } = await this.usersTable(rangeKey, page, undefined, start, end);
      all.push(...batch);
      if (all.length >= total || batch.length === 0 || page > 200) break;
      page++;
    }
    const header = ['Email', 'Name', 'Signup Date', 'Last Active', 'Login Days', 'Total Sessions', 'Total Session Time (s)', 'Avg Session (s)', 'RevBot Messages'];
    const lines = [header.join(',')];
    for (const r of all) {
      lines.push([
        r.email, r.name || '', r.signup_date?.toISOString() || '', r.last_active?.toISOString() || '',
        r.login_days, r.total_sessions, r.total_session_seconds, r.avg_session_seconds, r.revbot_messages,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    }
    return lines.join('\n');
  }
}
