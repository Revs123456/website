'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Flame, Calendar, ArrowRight, Bookmark, Briefcase,
  Bell, Loader2, MessageSquare, Map, BookOpen,
} from 'lucide-react';
import { userApi, type DashboardData } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
          {greeting}, {firstName} 👋
        </h1>
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
          {/* Quick links */}
          <div className="card" style={{ padding: 22 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>
              Keep going
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <QuickLink href="/roadmaps" icon={<Map size={16} style={{ color: '#2563eb' }} />} label="Roadmaps" desc="Follow a step-by-step learning path" />
              <QuickLink href="/courses" icon={<BookOpen size={16} style={{ color: '#7c3aed' }} />} label="Courses" desc="Curated courses by role & level" />
              <QuickLink href="/jobs" icon={<Briefcase size={16} style={{ color: '#b45309' }} />} label="Jobs" desc="Browse curated openings" />
              <QuickLink href="/community" icon={<MessageSquare size={16} style={{ color: '#059669' }} />} label="Community" desc="Ask questions, help others" />
            </div>
          </div>
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

function QuickLink({ href, icon, label, desc }: { href: string; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <Link href={href} className="card card-blue" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>{desc}</div>
      </div>
      <ArrowRight size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
    </Link>
  );
}

function greetingFor() {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
