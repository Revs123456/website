'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  BarChart3, Users, UserPlus, UserCheck, Activity, LogIn, Clock, Layers,
  Globe, MousePointerClick, TrendingUp, TrendingDown, Download, Search,
  ChevronLeft, ChevronRight, AlertCircle, Bot,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { api } from '@/lib/api';
import AdminSkeleton from '@/components/AdminSkeleton';

// ═══════════════════════════════════════════════════════════════════════════
// Every number on this page comes from one of two places, labeled wherever
// it's shown:
//   - "App DB"  — this app's own database (registered users only: signups,
//     logins, sessions, content views, RevBot usage — see AnalyticsService).
//   - "GA4"     — Google Analytics, already live in the frontend, covers
//     anonymous + registered traffic together (see Ga4Service).
// These are NEVER summed together — GA4's "users" and this app's "users"
// count different things (anonymous+registered vs. registered-only) and
// adding them would double-count registered visitors. See
// ANALYTICS_DESIGN.md for the full reasoning.
// ═══════════════════════════════════════════════════════════════════════════

const RANGE_OPTIONS: { key: string; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last30', label: 'Last 30 days' },
  { key: 'last90', label: 'Last 90 days' },
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'custom', label: 'Custom' },
];

const BLUE = '#2563eb', VIOLET = '#7c3aed', GREEN = '#059669', AMBER = '#d97706', CYAN = '#0891b2';

function fmtNum(n: number | undefined | null): string {
  if (n == null) return '—';
  return n.toLocaleString('en-IN');
}
function fmtDuration(seconds: number | undefined | null): string {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60), s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
function fmtPct(p: number | null | undefined): string | null {
  if (p == null) return null;
  return `${p >= 0 ? '↑' : '↓'} ${Math.abs(p).toFixed(1)}%`;
}

function SourceBadge({ source }: { source: 'app_db' | 'ga4' }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
      padding: '2px 6px', borderRadius: 4,
      background: source === 'ga4' ? '#f5f3ff' : '#eff6ff',
      color: source === 'ga4' ? VIOLET : BLUE,
    }}>
      {source === 'ga4' ? 'GA4' : 'App DB'}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, changePct, source, color }: {
  icon: any; label: string; value: string; changePct?: number | null; source: 'app_db' | 'ga4'; color: string;
}) {
  const pct = fmtPct(changePct);
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} style={{ color }} />
        </div>
        <SourceBadge source={source} />
      </div>
      <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>{value}</p>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{label}</p>
      {pct != null && (
        <p style={{ fontSize: 11, fontWeight: 600, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 3, color: changePct! >= 0 ? '#059669' : '#dc2626' }}>
          {changePct! >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {pct} vs previous period
        </p>
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle, source }: { title: string; subtitle?: string; source?: 'app_db' | 'ga4' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{subtitle}</p>}
      </div>
      {source && <SourceBadge source={source} />}
    </div>
  );
}

function ChartCard({ title, subtitle, source, loading, error, empty, children }: {
  title: string; subtitle?: string; source: 'app_db' | 'ga4'; loading: boolean; error?: string | null; empty?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <SectionHeader title={title} subtitle={subtitle} source={source} />
      {loading ? (
        <div style={{ height: 220 }}><AdminSkeleton rows={4} /></div>
      ) : error ? (
        <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94a3b8' }}>
          <AlertCircle size={22} />
          <p style={{ fontSize: 12, textAlign: 'center', maxWidth: 300 }}>{error}</p>
        </div>
      ) : empty ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
          No data for this range yet.
        </div>
      ) : (
        <div style={{ height: 220 }}>{children}</div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState('last30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [overview, setOverview] = useState<any>(null);
  const [overviewErr, setOverviewErr] = useState('');
  const [usersOverTime, setUsersOverTime] = useState<any[]>([]);
  const [signupsOverTime, setSignupsOverTime] = useState<any[]>([]);
  const [sessionsOverTime, setSessionsOverTime] = useState<any[]>([]);
  const [byHour, setByHour] = useState<any[]>([]);
  const [byDow, setByDow] = useState<any[]>([]);
  const [retention, setRetention] = useState<any>(null);
  const [revbot, setRevbot] = useState<any>(null);
  const [content, setContent] = useState<any>(null);

  const [traffic, setTraffic] = useState<any>(null);
  const [trafficErr, setTrafficErr] = useState('');
  const [trafficByDay, setTrafficByDay] = useState<any[]>([]);
  const [trafficByHour, setTrafficByHour] = useState<any[]>([]);
  const [trafficByDow, setTrafficByDow] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [trafficLoading, setTrafficLoading] = useState(true);

  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [usersTable, setUsersTable] = useState<any>(null);
  const [usersTableLoading, setUsersTableLoading] = useState(true);

  const qs = useCallback(() => {
    const p = new URLSearchParams({ range });
    if (range === 'custom' && customStart && customEnd) { p.set('start', customStart); p.set('end', customEnd); }
    return p.toString();
  }, [range, customStart, customEnd]);

  // ── App-DB analytics ──────────────────────────────────────────────────
  useEffect(() => {
    if (range === 'custom' && (!customStart || !customEnd)) return;
    let cancelled = false;
    setLoading(true);
    setOverviewErr('');
    const q = qs();

    Promise.all([
      api.analytics.overview(q).catch(e => { setOverviewErr('Could not load overview metrics.'); return null; }),
      api.analytics.usersOverTime(q).catch(() => []),
      api.analytics.signupsOverTime(q).catch(() => []),
      api.analytics.sessionsOverTime(q).catch(() => []),
      api.analytics.activityByHour(q).catch(() => []),
      api.analytics.activityByDayOfWeek(q).catch(() => []),
      api.analytics.retention(q).catch(() => null),
      api.analytics.revbot(q).catch(() => null),
      api.analytics.contentEngagement(q).catch(() => null),
    ]).then(([ov, uot, sot, sesot, hr, dow, ret, rb, ce]) => {
      if (cancelled) return;
      setOverview(ov); setUsersOverTime(uot); setSignupsOverTime(sot); setSessionsOverTime(sesot);
      setByHour(hr); setByDow(dow); setRetention(ret); setRevbot(rb); setContent(ce);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [qs, range, customStart, customEnd]);

  // ── GA4 traffic (independent load — a GA4 failure must not affect the rest) ──
  useEffect(() => {
    if (range === 'custom' && (!customStart || !customEnd)) return;
    let cancelled = false;
    setTrafficLoading(true);
    setTrafficErr('');
    const q = qs();

    Promise.all([
      api.analytics.trafficOverview(q).catch(() => ({ configured: false })),
      api.analytics.trafficByDay(q).catch(() => ({ rows: [] })),
      api.analytics.trafficByHour(q).catch(() => ({ rows: [] })),
      api.analytics.trafficByDayOfWeek(q).catch(() => ({ rows: [] })),
    ]).then(([ov, day, hour, dow]) => {
      if (cancelled) return;
      setTraffic(ov);
      if (ov && !ov.configured) setTrafficErr('GA4 is not configured yet (GA4_PROPERTY_ID / GA4_SERVICE_ACCOUNT_KEY_B64). See ANALYTICS_DESIGN.md for setup steps.');
      else if (ov?.error) setTrafficErr(`GA4 query failed: ${ov.error}`);
      setTrafficByDay(day.rows || []);
      setTrafficByHour(hour.rows || []);
      setTrafficByDow(dow.rows || []);
      setTrafficLoading(false);
    });

    return () => { cancelled = true; };
  }, [qs, range, customStart, customEnd]);

  // ── Users table (separate paginated load) ────────────────────────────
  useEffect(() => {
    if (range === 'custom' && (!customStart || !customEnd)) return;
    let cancelled = false;
    setUsersTableLoading(true);
    const p = new URLSearchParams(qs());
    p.set('page', String(userPage));
    if (userSearch) p.set('search', userSearch);
    api.analytics.usersTable(p.toString()).then(res => { if (!cancelled) { setUsersTable(res); setUsersTableLoading(false); } })
      .catch(() => { if (!cancelled) setUsersTableLoading(false); });
    return () => { cancelled = true; };
  }, [qs, userPage, userSearch, range, customStart, customEnd]);

  const m = overview?.metrics;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={15} style={{ color: BLUE }} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Analytics</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Anonymous visitors → registered users → signups → sessions → activity → retention.</p>
          </div>
        </div>
        <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/v1/analytics/export.csv?${qs()}`}
          className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Download size={13} /> Export CSV
        </a>
      </div>

      {/* Date range */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24, alignItems: 'center' }}>
        {RANGE_OPTIONS.map(o => (
          <button key={o.key} onClick={() => setRange(o.key)} style={{
            padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
            background: range === o.key ? BLUE : '#fff', color: range === o.key ? '#fff' : '#475569',
            borderColor: range === o.key ? BLUE : '#e2e8f0',
          }}>
            {o.label}
          </button>
        ))}
        {range === 'custom' && (
          <>
            <input type="date" className="input" style={{ width: 'auto' }} value={customStart} onChange={e => setCustomStart(e.target.value)} />
            <span style={{ color: '#94a3b8', fontSize: 12 }}>to</span>
            <input type="date" className="input" style={{ width: 'auto' }} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
          </>
        )}
      </div>

      {overviewErr && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>
          {overviewErr}
        </div>
      )}

      {/* ── Registered-user KPIs (App DB) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 12 }}>
        {loading ? Array.from({ length: 7 }).map((_, i) => <div key={i} className="card" style={{ padding: 18, height: 92 }}><AdminSkeleton rows={2} /></div>) : (
          <>
            <KpiCard icon={Users} label="Total Users" value={fmtNum(m?.total_users.value)} source="app_db" color={BLUE} />
            <KpiCard icon={UserPlus} label="New Users" value={fmtNum(m?.new_users.value)} changePct={m?.new_users.change_pct} source="app_db" color={GREEN} />
            <KpiCard icon={UserCheck} label="Returning Users" value={fmtNum(m?.returning_users.value)} changePct={m?.returning_users.change_pct} source="app_db" color={VIOLET} />
            <KpiCard icon={Activity} label="Active Users" value={fmtNum(m?.active_users.value)} changePct={m?.active_users.change_pct} source="app_db" color={AMBER} />
            <KpiCard icon={LogIn} label="Signups" value={fmtNum(m?.signups.value)} changePct={m?.signups.change_pct} source="app_db" color={CYAN} />
            <KpiCard icon={Layers} label="Total Sessions" value={fmtNum(m?.total_sessions.value)} changePct={m?.total_sessions.change_pct} source="app_db" color={BLUE} />
            <KpiCard icon={Clock} label="Avg Session Duration" value={fmtDuration(m?.avg_session_seconds.value)} changePct={m?.avg_session_seconds.change_pct} source="app_db" color={VIOLET} />
          </>
        )}
      </div>

      {/* ── Anonymous traffic KPIs (GA4) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 28 }}>
        {trafficLoading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="card" style={{ padding: 18, height: 92 }}><AdminSkeleton rows={2} /></div>) : traffic?.configured === false ? (
          <div className="card" style={{ padding: 18, gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 13 }}>
            <Globe size={16} /> GA4 traffic data not configured yet — see ANALYTICS_DESIGN.md for setup steps.
          </div>
        ) : traffic?.error ? (
          <div className="card" style={{ padding: 18, gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, color: '#dc2626', fontSize: 13 }}>
            <AlertCircle size={16} /> {traffic.error}
          </div>
        ) : (
          <>
            <KpiCard icon={Globe} label="Total Visitors" value={fmtNum(traffic?.metrics?.total_visitors.value)} changePct={traffic?.metrics?.total_visitors.change_pct} source="ga4" color={VIOLET} />
            <KpiCard icon={Layers} label="Sessions" value={fmtNum(traffic?.metrics?.sessions.value)} changePct={traffic?.metrics?.sessions.change_pct} source="ga4" color={BLUE} />
            <KpiCard icon={MousePointerClick} label="Page Views" value={fmtNum(traffic?.metrics?.page_views.value)} changePct={traffic?.metrics?.page_views.change_pct} source="ga4" color={CYAN} />
            <KpiCard icon={Clock} label="Avg Session Duration" value={fmtDuration(traffic?.metrics?.avg_session_seconds.value)} changePct={traffic?.metrics?.avg_session_seconds.change_pct} source="ga4" color={AMBER} />
            <KpiCard icon={Activity} label="Engaged Sessions" value={fmtNum(traffic?.metrics?.engaged_sessions.value)} changePct={traffic?.metrics?.engaged_sessions.change_pct} source="ga4" color={GREEN} />
          </>
        )}
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, marginBottom: 16 }}>
        <ChartCard title="New vs Returning Users" subtitle="Registered users, by day" source="app_db" loading={loading} empty={usersOverTime.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={usersOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="new_users" name="New" stackId="1" stroke={GREEN} fill={GREEN} fillOpacity={0.25} />
              <Area type="monotone" dataKey="returning_users" name="Returning" stackId="1" stroke={VIOLET} fill={VIOLET} fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Signups Over Time" source="app_db" loading={loading} empty={signupsOverTime.every(d => d.signups === 0)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={signupsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="signups" fill={BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sessions & Duration" subtitle="Registered users" source="app_db" loading={loading} empty={sessionsOverTime.every(d => d.sessions === 0)}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sessionsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="sessions" name="Sessions" stroke={BLUE} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="avg_session_seconds" name="Avg duration (s)" stroke={AMBER} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="GA4 Traffic Over Time" subtitle="All visitors, anonymous + registered" source="ga4" loading={trafficLoading} error={trafficErr || undefined} empty={trafficByDay.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trafficByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="active_users" name="Visitors" stroke={VIOLET} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="sessions" name="Sessions" stroke={CYAN} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Traffic by Hour" subtitle="All visitors — 24h, IST" source="ga4" loading={trafficLoading} error={trafficErr || undefined} empty={trafficByHour.every((d: any) => d.sessions === 0)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trafficByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={h => `${h}h`} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="sessions" fill={VIOLET} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Traffic by Day of Week" subtitle="All visitors" source="ga4" loading={trafficLoading} error={trafficErr || undefined} empty={trafficByDow.every((d: any) => d.sessions === 0)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trafficByDow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="sessions" fill={CYAN} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Registered-User Activity by Hour" subtitle="Signed-in page views only, IST" source="app_db" loading={loading} empty={byHour.every((d: any) => d.count === 0)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={h => `${h}h`} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={GREEN} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Registered-User Activity by Day" source="app_db" loading={loading} empty={byDow.every((d: any) => d.count === 0)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={AMBER} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Rev (AI Chatbot) Usage" subtitle="Logged-in /tools/revbot messages" source="app_db" loading={loading} empty={!revbot?.trend?.some((d: any) => d.messages > 0)}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revbot?.trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="messages" stroke={VIOLET} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── RevBot summary + widget beacon ── */}
      {!loading && revbot && (
        <div className="card" style={{ padding: 20, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bot size={18} style={{ color: VIOLET }} />
            <div>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{fmtNum(revbot.total_messages.value)}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>AI chat messages ({fmtNum(revbot.unique_users.value)} unique users)</p>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{fmtNum(revbot.widget_events.opened)}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Floating widget opened (logged-in users)</p>
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{fmtNum(revbot.widget_events.messages_sent)}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Widget messages sent (logged-in users)</p>
          </div>
        </div>
      )}

      {/* ── Retention ── */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <SectionHeader title="Retention" subtitle={`Cohort: users who signed up in this range (${retention?.cohort_size ?? 0} users)`} source="app_db" />
        {loading ? <AdminSkeleton rows={2} /> : retention?.cohort_size === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8' }}>No signups in this range yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
            {[['Day 1', retention?.day1], ['Day 7', retention?.day7], ['Day 30', retention?.day30]].map(([label, r]: any) => (
              <div key={label}>
                <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>{label} Retention</p>
                {r ? (
                  <>
                    <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>{r.pct}%</p>
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{r.returned} of {r.eligible} eligible users returned</p>
                  </>
                ) : (
                  <p style={{ fontSize: 12, color: '#cbd5e1' }}>Not enough time has passed yet</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Content engagement ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        {[
          { title: 'Most Saved Jobs', rows: content?.most_saved_jobs?.rows, note: content?.most_saved_jobs?.source },
          { title: 'Most Applied-To Companies', rows: content?.most_applied_companies?.rows, note: content?.most_applied_companies?.source },
          { title: 'Most Viewed Courses', rows: content?.most_viewed_courses?.rows, note: content?.most_viewed_courses?.source },
        ].map(({ title, rows, note }) => (
          <div key={title} className="card" style={{ padding: 20 }}>
            <SectionHeader title={title} source="app_db" />
            {loading ? <AdminSkeleton rows={4} /> : !rows || rows.length === 0 ? (
              <p style={{ fontSize: 12, color: '#94a3b8' }}>No data for this range yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rows.map((r: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</div>
                      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, marginTop: 3 }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (r.count / rows[0].count) * 100)}%`, background: BLUE, borderRadius: 99 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>{r.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {content?.roadmap_page_views && (
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 24 }}>
          Roadmaps page views: <strong style={{ color: '#0f172a' }}>{content.roadmap_page_views.value}</strong> — {content.roadmap_page_views.note}
        </p>
      )}

      {/* ── Detailed user table ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: 20, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <SectionHeader title="Registered Users" subtitle="Signup + activity detail per user" source="app_db" />
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input className="input" style={{ paddingLeft: 30, width: 220 }} placeholder="Search email or name…"
              value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }} />
          </div>
        </div>
        {usersTableLoading ? <div style={{ padding: 20 }}><AdminSkeleton rows={6} /></div> : !usersTable?.rows?.length ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No users found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                  {['Email', 'Name', 'Signup Date', 'Last Active', 'Login Days', 'Sessions', 'Avg Session', 'RevBot Msgs'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersTable.rows.map((u: any) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0f172a' }}>{u.email}</td>
                    <td style={{ padding: '10px 16px', color: '#64748b' }}>{u.name || '—'}</td>
                    <td style={{ padding: '10px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(u.signup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                    <td style={{ padding: '10px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{u.last_active ? new Date(u.last_active).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}</td>
                    <td style={{ padding: '10px 16px', color: '#475569' }}>{u.login_days}</td>
                    <td style={{ padding: '10px 16px', color: '#475569' }}>{u.total_sessions}</td>
                    <td style={{ padding: '10px 16px', color: '#475569' }}>{fmtDuration(u.avg_session_seconds)}</td>
                    <td style={{ padding: '10px 16px', color: '#475569' }}>{u.revbot_messages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {usersTable && usersTable.total > usersTable.page_size && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #f1f5f9' }}>
            <button onClick={() => setUserPage(p => p - 1)} disabled={userPage === 1}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: userPage === 1 ? '#f8fafc' : '#fff', color: userPage === 1 ? '#cbd5e1' : '#374151', cursor: userPage === 1 ? 'default' : 'pointer', fontSize: 13 }}>
              <ChevronLeft size={14} /> Prev
            </button>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Page {userPage} of {Math.ceil(usersTable.total / usersTable.page_size)}</span>
            <button onClick={() => setUserPage(p => p + 1)} disabled={userPage * usersTable.page_size >= usersTable.total}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: userPage * usersTable.page_size >= usersTable.total ? '#f8fafc' : '#fff', color: userPage * usersTable.page_size >= usersTable.total ? '#cbd5e1' : '#374151', cursor: userPage * usersTable.page_size >= usersTable.total ? 'default' : 'pointer', fontSize: 13 }}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
