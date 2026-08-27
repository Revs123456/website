'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Flame, Calendar, ArrowRight, Bookmark, Briefcase, Sparkles,
  Bell, Loader2, MessageSquare, Crown, Zap, Target,
} from 'lucide-react';
import { userApi, type DashboardData } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import ActivityFeedItem from '@/components/ActivityFeedItem';

const STATUS_LABEL: Record<string, string> = {
  saved: 'Saved', applied: 'Applied', interview: 'Interview',
  offer: 'Offer', rejected: 'Rejected',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/'); return; }
    (async () => {
      try { setData(await userApi.getDashboard()); }
      catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [user, userLoading, router]);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 24px' }}>
        <Loader2 size={28} className="spin" style={{ color: '#94a3b8' }} />
        <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
      </div>
    );
  }

  const greeting = greetingFor();
  const firstName = (data.user.name || data.user.username || 'there').split(' ')[0];

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '96px 24px 60px' }}>
      {/* Hero greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            {greeting}, {firstName} 👋
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {data.user.level_name} · Lv {data.user.level} · {data.user.xp.toLocaleString('en-IN')} XP
          </p>
        </div>
        {!data.user.is_pro && (
          <Link href="/pricing" className="btn btn-blue btn-sm" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
            <Crown size={13} /> Upgrade to Pro
          </Link>
        )}
      </div>

      {/* Counters row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard
          icon={<Flame size={18} style={{ color: '#dc2626' }} />}
          label="Day streak"
          value={data.streak.current_streak}
          link="/challenges"
        />
        <StatCard
          icon={<Zap size={18} style={{ color: '#2563eb' }} />}
          label="XP this week"
          value={`+${data.counters.weekly_xp.toLocaleString('en-IN')}`}
        />
        <StatCard
          icon={<Bookmark size={18} style={{ color: '#64748b' }} />}
          label="Saved jobs"
          value={data.counters.saved_jobs}
          link="/saved-jobs"
        />
        <StatCard
          icon={<Briefcase size={18} style={{ color: '#b45309' }} />}
          label="In progress"
          value={data.counters.active_applications}
          link="/applications"
        />
        <StatCard
          icon={<Bell size={18} style={{ color: '#7c3aed' }} />}
          label="Notifications"
          value={data.counters.unread_notifications}
          link="/notifications"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 18 }}>
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Today's challenge CTA — only show if streak is at risk OR not active today */}
          <DailyChallengeCTA streak={data.streak} />

          {/* Upcoming follow-ups */}
          {data.upcoming_follow_ups.length > 0 && (
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={15} /> Follow-ups this week
                </h2>
                <Link href="/applications" style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                  See all <ArrowRight size={11} style={{ display: 'inline', verticalAlign: -1 }} />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.upcoming_follow_ups.map(f => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{f.role}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{f.company}</div>
                    </div>
                    <span style={{ fontSize: 11, color: '#b45309', fontWeight: 600 }}>
                      {new Date(f.next_follow_up).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active applications snapshot */}
          {data.active_applications.length > 0 && (
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Briefcase size={15} /> Active applications
                </h2>
                <Link href="/applications" style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                  Open tracker <ArrowRight size={11} style={{ display: 'inline', verticalAlign: -1 }} />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.active_applications.slice(0, 5).map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.role}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{a.company}</div>
                    </div>
                    <span className={`badge ${a.status === 'interview' ? 'badge-amber' : a.status === 'offer' ? 'badge-green' : 'badge-blue'}`}>
                      {STATUS_LABEL[a.status] || a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unsolved community questions — engagement bait */}
          {data.unsolved_questions.length > 0 && (
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageSquare size={15} /> Help answer
                </h2>
                <Link href="/community" style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                  All questions <ArrowRight size={11} style={{ display: 'inline', verticalAlign: -1 }} />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.unsolved_questions.map(q => (
                  <Link key={q.id} href={`/community/${q.id}`} style={{ textDecoration: 'none', display: 'block', padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {q.answers_count} answer{q.answers_count === 1 ? '' : 's'} · {q.votes_count} vote{q.votes_count === 1 ? '' : 's'}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Recent badges */}
          {data.recent_badges.length > 0 && (
            <div className="card" style={{ padding: 22 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={15} /> Recent badges
              </h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {data.recent_badges.map(rb => (
                  <div key={rb.badge.code} title={rb.badge.name} style={{
                    padding: '10px 12px', borderRadius: 10, textAlign: 'center',
                    background: rb.badge.tier === 'gold' ? '#fffbeb' : rb.badge.tier === 'silver' ? '#f8fafc' : '#fef3c7',
                    border: `1px solid ${rb.badge.tier === 'gold' ? '#fde68a' : rb.badge.tier === 'silver' ? '#cbd5e1' : '#fdba74'}`,
                    minWidth: 70,
                  }}>
                    <div style={{ fontSize: 22, lineHeight: 1, marginBottom: 4 }}>{rb.badge.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#0f172a' }}>{rb.badge.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My recent activity */}
          {data.my_recent_activity.length > 0 && (
            <div className="card" style={{ padding: 22 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={15} /> Your week
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.my_recent_activity.slice(0, 5).map(ev => (
                  <ActivityFeedItem key={ev.id} event={ev} showUser={false} />
                ))}
              </div>
            </div>
          )}

          {/* Community pulse */}
          {data.public_activity.length > 0 && (
            <div className="card" style={{ padding: 22 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flame size={15} style={{ color: '#dc2626' }} /> Community pulse
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.public_activity.slice(0, 6).map(ev => (
                  <ActivityFeedItem key={ev.id} event={ev} showUser={true} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes _spin { to { transform: rotate(360deg); } }
        .spin { animation: _spin 1s linear infinite; }
        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ icon, label, value, link }: { icon: React.ReactNode; label: string; value: number | string; link?: string }) {
  const content = (
    <div className={link ? 'card card-blue' : 'card'} style={{
      padding: 14, display: 'flex', alignItems: 'center', gap: 12,
      textDecoration: 'none', cursor: link ? 'pointer' : 'default',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.05, fontWeight: 600, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
  return link ? <Link href={link} style={{ textDecoration: 'none' }}>{content}</Link> : content;
}

function DailyChallengeCTA({ streak }: { streak: { current_streak: number; last_activity_date: string | null } }) {
  const today = istTodayClient();
  const yesterday = istYesterdayClient();
  const activeToday = streak.last_activity_date === today;
  const atRisk = !activeToday && streak.last_activity_date === yesterday && streak.current_streak > 0;

  if (activeToday) return null;   // user is set for today

  return (
    <div className="card" style={{
      padding: 22,
      background: atRisk ? 'linear-gradient(135deg,#fef2f2,#fef3c7)' : 'linear-gradient(135deg,#eff6ff,#f5f3ff)',
      borderColor: atRisk ? '#fecaca' : '#bfdbfe',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg,#dc2626,#f59e0b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Flame size={22} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: atRisk ? '#7f1d1d' : '#0f172a', margin: 0 }}>
            {atRisk ? `Don't break your ${streak.current_streak}-day streak!` : 'Take today\'s challenge'}
          </h3>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
            One question. 5 minutes. +50 XP.
          </p>
        </div>
        <Link href="/challenges" className="btn btn-blue btn-sm">
          Start <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

function greetingFor() {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function istTodayClient(): string {
  const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
function istYesterdayClient(): string {
  const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
