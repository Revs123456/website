import { Injectable, Logger } from '@nestjs/common';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { resolveDateRange, RangeKey } from './date-range.util';

// ═══════════════════════════════════════════════════════════════════════════
// Anonymous/public traffic — sourced from the GA4 property already live in
// the frontend (see app/layout.tsx's gtag.js snippet, measurement ID
// NEXT_PUBLIC_GA_ID). This service only *reads* GA4's Reporting API; it does
// not touch the existing frontend measurement code at all.
//
// NOTE (read before trusting these numbers): this integration is implemented
// exactly per Google's documented GA4 Data API contract, but has not been
// exercised against a live GA4 property in this environment — there are no
// credentials available here to test with. Every method fails soft (returns
// `{ configured: false }` or `{ error }`) rather than throwing, so a bad
// integration can't take down the rest of the dashboard — but the actual
// numbers should be spot-checked against the GA4 UI once real credentials
// are in place, the same way every other metric in this feature was
// verified against live data before being called done.
//
// Setup required (see ANALYTICS_DESIGN.md for the full walkthrough):
//   GA4_PROPERTY_ID              - numeric GA4 property id (Admin > Property Settings)
//   GA4_SERVICE_ACCOUNT_KEY_B64  - base64-encoded service-account JSON key,
//                                  granted "Viewer" on the GA4 property
// ═══════════════════════════════════════════════════════════════════════════
@Injectable()
export class Ga4Service {
  private readonly logger = new Logger(Ga4Service.name);
  private client: BetaAnalyticsDataClient | null = null;
  private propertyId: string | null = null;
  private initError: string | null = null;

  constructor() {
    this.propertyId = process.env.GA4_PROPERTY_ID || null;
    const keyB64 = process.env.GA4_SERVICE_ACCOUNT_KEY_B64;

    if (!this.propertyId || !keyB64) {
      this.initError = 'GA4_PROPERTY_ID / GA4_SERVICE_ACCOUNT_KEY_B64 not set';
      return;
    }
    try {
      const json = JSON.parse(Buffer.from(keyB64, 'base64').toString('utf8'));
      this.client = new BetaAnalyticsDataClient({
        credentials: { client_email: json.client_email, private_key: json.private_key },
      });
    } catch (err: any) {
      this.initError = `Failed to parse GA4 service account key: ${err.message}`;
      this.logger.error(this.initError);
    }
  }

  isConfigured(): boolean {
    return !!this.client && !!this.propertyId;
  }

  private toGa4Date(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  /** Overview KPIs with period-over-period comparison, in a single request via named date ranges. */
  async overview(rangeKey: RangeKey, start?: string, end?: string) {
    if (!this.isConfigured()) return { configured: false, error: this.initError };
    const { start: s, end: e, previousStart, previousEnd } = resolveDateRange(rangeKey, start, end);

    try {
      const [response] = await this.client!.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          { startDate: this.toGa4Date(s), endDate: this.toGa4Date(e), name: 'current' },
          { startDate: this.toGa4Date(previousStart), endDate: this.toGa4Date(previousEnd), name: 'previous' },
        ],
        metrics: [
          { name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' },
          { name: 'averageSessionDuration' }, { name: 'engagedSessions' },
        ],
      });

      // No explicit `dimensions` were requested, so GA4 auto-adds a single
      // "dateRange" pseudo-dimension to each row, valued with the `name` we
      // gave each date range above ('current' / 'previous').
      const byRange: Record<string, number[]> = {};
      for (const row of response.rows || []) {
        const rangeName = row.dimensionValues?.[0]?.value || 'current';
        byRange[rangeName] = (row.metricValues || []).map(v => Number(v.value || 0));
      }
      const cur = byRange['current'] || [0, 0, 0, 0, 0];
      const prev = byRange['previous'] || [0, 0, 0, 0, 0];
      const pct = (c: number, p: number) => (p === 0 ? null : Math.round(((c - p) / p) * 1000) / 10);

      return {
        configured: true,
        source: 'ga4',
        metrics: {
          total_visitors:  { value: cur[0], change_pct: pct(cur[0], prev[0]) },
          sessions:         { value: cur[1], change_pct: pct(cur[1], prev[1]) },
          page_views:       { value: cur[2], change_pct: pct(cur[2], prev[2]) },
          avg_session_seconds: { value: Math.round(cur[3]), change_pct: pct(cur[3], prev[3]) },
          engaged_sessions: { value: cur[4], change_pct: pct(cur[4], prev[4]) },
        },
      };
    } catch (err: any) {
      this.logger.error(`GA4 overview query failed: ${err.message}`);
      return { configured: true, error: err.message };
    }
  }

  async trafficByDay(rangeKey: RangeKey, start?: string, end?: string) {
    if (!this.isConfigured()) return { configured: false, error: this.initError, rows: [] };
    const { start: s, end: e } = resolveDateRange(rangeKey, start, end);
    try {
      const [response] = await this.client!.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [{ startDate: this.toGa4Date(s), endDate: this.toGa4Date(e) }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      });
      const rows = (response.rows || []).map(r => ({
        date: this.formatGa4Date(r.dimensionValues?.[0]?.value || ''),
        active_users: Number(r.metricValues?.[0]?.value || 0),
        sessions: Number(r.metricValues?.[1]?.value || 0),
      }));
      return { configured: true, source: 'ga4', rows };
    } catch (err: any) {
      this.logger.error(`GA4 trafficByDay query failed: ${err.message}`);
      return { configured: true, error: err.message, rows: [] };
    }
  }

  async trafficByHour(rangeKey: RangeKey, start?: string, end?: string) {
    if (!this.isConfigured()) return { configured: false, error: this.initError, rows: [] };
    const { start: s, end: e } = resolveDateRange(rangeKey, start, end);
    try {
      const [response] = await this.client!.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [{ startDate: this.toGa4Date(s), endDate: this.toGa4Date(e) }],
        dimensions: [{ name: 'hour' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: [{ dimension: { dimensionName: 'hour' } }],
      });
      const map = new Map<number, { active_users: number; sessions: number }>();
      for (const r of response.rows || []) {
        const hour = Number(r.dimensionValues?.[0]?.value || 0);
        map.set(hour, { active_users: Number(r.metricValues?.[0]?.value || 0), sessions: Number(r.metricValues?.[1]?.value || 0) });
      }
      const rows = Array.from({ length: 24 }, (_, hour) => ({ hour, ...(map.get(hour) || { active_users: 0, sessions: 0 }) }));
      return { configured: true, source: 'ga4', rows };
    } catch (err: any) {
      this.logger.error(`GA4 trafficByHour query failed: ${err.message}`);
      return { configured: true, error: err.message, rows: [] };
    }
  }

  async trafficByDayOfWeek(rangeKey: RangeKey, start?: string, end?: string) {
    if (!this.isConfigured()) return { configured: false, error: this.initError, rows: [] };
    const { start: s, end: e } = resolveDateRange(rangeKey, start, end);
    try {
      const [response] = await this.client!.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [{ startDate: this.toGa4Date(s), endDate: this.toGa4Date(e) }],
        dimensions: [{ name: 'dayOfWeekName' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      });
      const order = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const map = new Map((response.rows || []).map(r => [
        r.dimensionValues?.[0]?.value || '',
        { active_users: Number(r.metricValues?.[0]?.value || 0), sessions: Number(r.metricValues?.[1]?.value || 0) },
      ]));
      const rows = order.map(day => ({ day: day.slice(0, 3), ...(map.get(day) || { active_users: 0, sessions: 0 }) }));
      return { configured: true, source: 'ga4', rows };
    } catch (err: any) {
      this.logger.error(`GA4 trafficByDayOfWeek query failed: ${err.message}`);
      return { configured: true, error: err.message, rows: [] };
    }
  }

  private formatGa4Date(yyyymmdd: string): string {
    if (yyyymmdd.length !== 8) return yyyymmdd;
    return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
  }
}
