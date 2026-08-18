'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User as UserIcon, Mail, Briefcase, Target, Github, Linkedin, Save,
  LogOut, Trash2, Loader2, Award, Flame, Check, AtSign, Bell,
  Lock, ArrowRight, Calendar, Globe, Gift, Copy, Sparkles, Users, Crown,
  XCircle, Receipt,
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import {
  userApi, type SiteUser, type EngagementDashboard, type ReferralStats,
  type UsageDashboard, type Subscription, type PaymentEventRow,
  LEVEL_NAMES, levelProgress,
} from '@/lib/api';
import ShareableStreakCard from '@/components/ShareableStreakCard';

const EXPERIENCE_OPTIONS = ['0-1 years', '1-3 years', '3-5 years', '5-8 years', '8+ years'];

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout, patchLocal, refresh } = useUser();

  // Redirect to home for unauthenticated visitors after hydration finishes.
  // We don't gate at the route level (no middleware) because UserContext
  // hydration is client-side — middleware can't see the auth state reliably.
  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} className="spin" style={{ color: '#94a3b8' }} />
        <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '96px 24px 60px' }}>
      <Header user={user} />
      <EngagementPanels user={user} />
      <BillingPanel user={user} refresh={refresh} />
      <AiUsagePanel />
      <ReferralPanel user={user} />
      <ProfileForm user={user} patchLocal={patchLocal} />
      <PrivacyPanel user={user} patchLocal={patchLocal} />
      <Preferences user={user} patchLocal={patchLocal} />
      <DangerZone onLogout={async () => { await logout(); router.replace('/'); }} />
    </div>
  );
}

// ── Header (avatar + stats: XP, level, Pro) ─────────────────────────────────
function Header({ user }: { user: SiteUser }) {
  const initials = (user.name || user.email).split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="card" style={{ padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16, flexShrink: 0,
        background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em',
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
          {user.name || 'Your account'}
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Mail size={13} /> {user.email}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {user.is_pro && <span className="badge badge-violet">PRO</span>}
        <span className="badge badge-blue" title={`Level ${user.level}`}>
          <Award size={11} style={{ marginRight: 3 }} /> {LEVEL_NAMES[Math.max(0, Math.min(user.level - 1, LEVEL_NAMES.length - 1))]}
        </span>
        {(user.streak?.current_streak ?? 0) > 0 && (
          <span className="badge badge-amber">
            <Flame size={11} style={{ marginRight: 3 }} /> {user.streak!.current_streak}d streak
          </span>
        )}
      </div>
    </div>
  );
}

// ── Profile form ────────────────────────────────────────────────────────────
function ProfileForm({ user, patchLocal }: { user: SiteUser; patchLocal: (p: Partial<SiteUser>) => void }) {
  const [form, setForm] = useState({
    name: user.name ?? '',
    username: user.username ?? '',
    phone: user.phone ?? '',
    experience: user.experience ?? '',
    target_role: user.target_role ?? '',
    current_role: user.current_role ?? '',
    bio: user.bio ?? '',
    github_url: user.github_url ?? '',
    linkedin_url: user.linkedin_url ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      // Only send fields the user actually filled — keeps PATCH payload minimal
      // and skips re-validating untouched fields.
      const payload: Record<string, any> = {};
      (Object.keys(form) as (keyof typeof form)[]).forEach(k => {
        const v = form[k]?.trim();
        if (v !== (user[k] ?? '')) payload[k] = v || undefined;
      });
      if (Object.keys(payload).length === 0) {
        setSaved(true);
        return;
      }
      const updated = await userApi.updateProfile(payload);
      patchLocal(updated);
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="card" style={{ padding: 24, marginBottom: 20 }}>
      <h2 style={sectionTitle}>Profile</h2>
      <p style={sectionHint}>How you appear on the platform. Used for personalization and your future public profile.</p>

      <div style={grid2}>
        <Field label="Full name" icon={<UserIcon size={14} />}>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Sharma" maxLength={80} />
        </Field>
        <Field label="Username" icon={<AtSign size={14} />} hint="Lowercase letters, numbers, underscore (3–30 chars). Your future public URL.">
          <input
            className="input"
            value={form.username}
            onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="jane_dev"
            maxLength={30}
          />
        </Field>
        <Field label="Phone (optional)" icon={<Mail size={14} />}>
          <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98XXXXXX21" maxLength={20} />
        </Field>
        <Field label="Experience" icon={<Briefcase size={14} />}>
          <select className="input" value={form.experience} onChange={e => set('experience', e.target.value)}>
            <option value="">Select…</option>
            {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Current role" icon={<Briefcase size={14} />}>
          <input className="input" value={form.current_role} onChange={e => set('current_role', e.target.value)} placeholder="Frontend Engineer" maxLength={80} />
        </Field>
        <Field label="Target role" icon={<Target size={14} />}>
          <input className="input" value={form.target_role} onChange={e => set('target_role', e.target.value)} placeholder="Senior Backend Engineer" maxLength={80} />
        </Field>
        <Field label="GitHub URL" icon={<Github size={14} />}>
          <input className="input" type="url" value={form.github_url} onChange={e => set('github_url', e.target.value)} placeholder="https://github.com/janedev" maxLength={300} />
        </Field>
        <Field label="LinkedIn URL" icon={<Linkedin size={14} />}>
          <input className="input" type="url" value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/jane" maxLength={300} />
        </Field>
      </div>

      <div style={{ marginTop: 16 }}>
        <Field label="Bio (optional)">
          <textarea
            className="input"
            value={form.bio}
            onChange={e => set('bio', e.target.value)}
            placeholder="One line about what you're working on."
            maxLength={500}
            rows={3}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </Field>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#dc2626', marginTop: 12 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type="submit" disabled={saving} className="btn btn-blue" style={{ opacity: saving ? 0.7 : 1 }}>
          {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Check size={14} /> Saved
          </span>
        )}
      </div>
      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </form>
  );
}

// ── Preferences (email opt-in) ──────────────────────────────────────────────
function Preferences({ user, patchLocal }: { user: SiteUser; patchLocal: (p: Partial<SiteUser>) => void }) {
  const [emailOptIn, setEmailOptIn] = useState(user.email_opt_in);
  const [busy, setBusy] = useState(false);

  async function toggle(next: boolean) {
    setBusy(true);
    const prev = emailOptIn;
    setEmailOptIn(next);
    try {
      await userApi.updateProfile({ email_opt_in: next });
      patchLocal({ email_opt_in: next });
    } catch {
      setEmailOptIn(prev);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ padding: 24, marginBottom: 20 }}>
      <h2 style={sectionTitle}>Notifications</h2>
      <p style={sectionHint}>Control what hits your inbox.</p>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: busy ? 'wait' : 'pointer' }}>
        <Bell size={18} style={{ color: '#475569', marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Email me jobs, tips, and updates</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Weekly digest + alerts for jobs that match your target role.</div>
        </div>
        <input
          type="checkbox"
          checked={emailOptIn}
          onChange={e => toggle(e.target.checked)}
          disabled={busy}
          style={{ width: 18, height: 18, accentColor: '#2563eb', marginTop: 3 }}
        />
      </label>
    </div>
  );
}

// ── Logout + delete account ─────────────────────────────────────────────────
function DangerZone({ onLogout }: { onLogout: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setDeleting(true); setError('');
    try {
      await userApi.deleteAccount();
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Could not delete account.');
      setDeleting(false);
    }
  }

  return (
    <div className="card" style={{ padding: 24, borderColor: '#fecaca' }}>
      <h2 style={{ ...sectionTitle, color: '#b91c1c' }}>Account actions</h2>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={onLogout} className="btn btn-outline">
          <LogOut size={14} /> Log out
        </button>
        {!confirmDelete && (
          <button onClick={() => setConfirmDelete(true)} className="btn btn-outline" style={{ color: '#dc2626', borderColor: '#fecaca' }}>
            <Trash2 size={14} /> Delete account
          </button>
        )}
      </div>

      {confirmDelete && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 14, color: '#7f1d1d', margin: '0 0 12px', fontWeight: 600 }}>
            Permanently delete your account? This cannot be undone.
          </p>
          <p style={{ fontSize: 12, color: '#991b1b', margin: '0 0 12px' }}>
            Your profile, saved data, and session will be removed immediately.
          </p>
          {error && <p style={{ fontSize: 12, color: '#dc2626', margin: '0 0 12px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleDelete} disabled={deleting} className="btn btn-sm" style={{ background: '#dc2626', color: '#fff', opacity: deleting ? 0.7 : 1 }}>
              {deleting ? 'Deleting…' : 'Yes, delete forever'}
            </button>
            <button onClick={() => setConfirmDelete(false)} disabled={deleting} className="btn btn-sm btn-outline">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared styles ───────────────────────────────────────────────────────────
const sectionTitle: React.CSSProperties = {
  fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.01em',
};
const sectionHint: React.CSSProperties = {
  fontSize: 13, color: '#64748b', margin: '0 0 18px',
};
const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
};

function Field({ label, icon, hint, children }: { label: string; icon?: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {icon}{label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// ── Engagement panels (Phase 2) ─────────────────────────────────────────────
function EngagementPanels({ user }: { user: SiteUser }) {
  const [dash, setDash] = useState<EngagementDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await userApi.engagementDashboard();
        if (!cancelled) setDash(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <ProgressPanel user={user} streak={dash?.streak ?? null} />
      <BadgesPanel dash={dash} loading={loading} />
    </>
  );
}

function ProgressPanel({ user, streak }: {
  user: SiteUser;
  streak: EngagementDashboard['streak'] | null;
}) {
  const prog = levelProgress(user.xp);

  return (
    <div className="card" style={{ padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={sectionTitle}>Progress</h2>
        <Link href="/challenges" style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          Today&apos;s challenge <ArrowRight size={12} />
        </Link>
      </div>
      <p style={sectionHint}>Earn XP by completing daily challenges and building your profile.</p>

      {/* Level + XP bar */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
            {prog.name} · Level {prog.level}
          </span>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            {prog.is_max_level
              ? `${user.xp.toLocaleString('en-IN')} XP (max tier)`
              : `${user.xp.toLocaleString('en-IN')} / ${prog.next_threshold.toLocaleString('en-IN')} XP`
            }
          </span>
        </div>
        <div style={{ height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
          <div
            style={{
              width: `${prog.progress_pct}%`, height: '100%',
              background: 'linear-gradient(90deg,#2563eb,#7c3aed)',
              transition: 'width .6s ease',
            }}
          />
        </div>
        {!prog.is_max_level && (
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
            {prog.xp_to_next.toLocaleString('en-IN')} XP to next tier
          </p>
        )}
      </div>

      {/* Streak summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard
          icon={<Flame size={18} style={{ color: streak?.at_risk ? '#dc2626' : '#f59e0b' }} />}
          label="Current streak"
          value={`${streak?.current_streak ?? 0} day${(streak?.current_streak ?? 0) === 1 ? '' : 's'}`}
          tone={streak?.at_risk ? 'danger' : 'amber'}
          subtext={streak?.at_risk ? 'At risk — take today\'s challenge!' : streak?.active_today ? 'Active today ✓' : undefined}
        />
        <StatCard
          icon={<Calendar size={18} style={{ color: '#64748b' }} />}
          label="Longest streak"
          value={`${streak?.longest_streak ?? 0} day${(streak?.longest_streak ?? 0) === 1 ? '' : 's'}`}
        />
        <StatCard
          icon={<Lock size={18} style={{ color: '#64748b' }} />}
          label="Streak shields"
          value={`${streak?.shields_remaining ?? 0}`}
          subtext={!user.is_pro ? 'Pro only' : 'Auto-saves 1 missed day'}
        />
      </div>

      {/* Shareable card — only when there's actually a streak to brag about */}
      {(streak?.current_streak ?? 0) >= 3 && (
        <div style={{ marginTop: 18 }}>
          <ShareableStreakCard
            streak={streak!.current_streak}
            userName={user.name}
            xp={user.xp}
            level={user.level}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, subtext, tone = 'slate' }: {
  icon: React.ReactNode; label: string; value: string; subtext?: string;
  tone?: 'slate' | 'amber' | 'danger';
}) {
  const bg = tone === 'danger' ? '#fef2f2' : tone === 'amber' ? '#fffbeb' : '#f8fafc';
  const border = tone === 'danger' ? '#fecaca' : tone === 'amber' ? '#fde68a' : '#e2e8f0';
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {icon}
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.04 }}>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{value}</div>
      {subtext && <div style={{ fontSize: 11, color: tone === 'danger' ? '#b91c1c' : '#64748b', marginTop: 2 }}>{subtext}</div>}
    </div>
  );
}

function BadgesPanel({ dash, loading }: { dash: EngagementDashboard | null; loading: boolean }) {
  return (
    <div className="card" style={{ padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={sectionTitle}>Badges</h2>
        {dash && (
          <span style={{ fontSize: 12, color: '#64748b' }}>
            {dash.earned_count} of {dash.total_count} earned
          </span>
        )}
      </div>
      <p style={sectionHint}>Unlock badges by hitting milestones. Earned ones appear in color.</p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
          <Loader2 size={20} className="spin" style={{ color: '#cbd5e1' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {dash?.badges.map(b => (
            <div
              key={b.id}
              title={b.description}
              style={{
                padding: 14, borderRadius: 10,
                background: b.earned ? badgeBgByTier(b.tier) : '#f8fafc',
                border: `1px solid ${b.earned ? badgeBorderByTier(b.tier) : '#e2e8f0'}`,
                opacity: b.earned ? 1 : 0.45,
                textAlign: 'center', position: 'relative',
                transition: 'transform .2s',
              }}
            >
              <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 6 }}>{b.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{b.name}</div>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.05, fontWeight: 600 }}>
                {b.tier}
              </div>
              {b.earned && <Check size={12} style={{ position: 'absolute', top: 8, right: 8, color: '#16a34a' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function badgeBgByTier(tier: string) {
  switch (tier) {
    case 'platinum': return 'linear-gradient(135deg,#ecfeff,#cffafe)';
    case 'gold':     return 'linear-gradient(135deg,#fffbeb,#fef3c7)';
    case 'silver':   return 'linear-gradient(135deg,#f8fafc,#e2e8f0)';
    default:         return 'linear-gradient(135deg,#fef3c7,#fed7aa)'; // bronze
  }
}
function badgeBorderByTier(tier: string) {
  switch (tier) {
    case 'platinum': return '#67e8f9';
    case 'gold':     return '#fde68a';
    case 'silver':   return '#cbd5e1';
    default:         return '#fdba74'; // bronze
  }
}

// ── Phase 3: Referral panel ────────────────────────────────────────────────
function ReferralPanel({ user }: { user: SiteUser }) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await userApi.myReferralStats();
        setStats(s);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const code = stats?.referral_code ?? user.referral_code ?? null;
  const refUrl = typeof window !== 'undefined' && code ? `${window.location.origin}/?ref=${code}` : '';

  async function copyLink() {
    if (!refUrl) return;
    try { await navigator.clipboard.writeText(refUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* silent */ }
  }
  async function shareLink() {
    if (!refUrl) return;
    const text = `Building your tech career? Join me on TechChampsByRev — we both get +200 XP when you sign up.\n\n${refUrl}`;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: 'Join me on TechChampsByRev', text, url: refUrl }); return; } catch { /* fall through */ }
    }
    copyLink();
  }

  return (
    <div className="card" style={{ padding: 24, marginBottom: 20, background: 'linear-gradient(135deg,#eff6ff 0%,#f5f3ff 100%)', borderColor: '#bfdbfe' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Gift size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h2 style={{ ...sectionTitle, marginBottom: 4 }}>Invite friends, earn XP</h2>
          <p style={{ ...sectionHint, marginBottom: 14 }}>
            Share your link. When someone signs up, <strong>you both get +{stats?.xp_per_referral ?? 200} XP</strong>.
          </p>

          {loading ? (
            <Loader2 size={20} className="spin" style={{ color: '#94a3b8' }} />
          ) : (
            <>
              {/* Referral link box */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#fff', border: '1px solid #bfdbfe', borderRadius: 10,
                padding: '8px 10px 8px 14px',
              }}>
                <code style={{ flex: 1, fontSize: 13, color: '#0f172a', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {refUrl || 'Generating…'}
                </code>
                <button onClick={copyLink} className="btn btn-sm btn-outline" style={{ flexShrink: 0 }} disabled={!refUrl}>
                  {copied ? <Check size={12} style={{ color: '#16a34a' }} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={shareLink} className="btn btn-sm btn-blue" style={{ flexShrink: 0 }} disabled={!refUrl}>
                  Share
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 14 }}>
                <StatCard
                  icon={<Users size={16} style={{ color: '#2563eb' }} />}
                  label="Friends invited"
                  value={String(stats?.referred_count ?? 0)}
                />
                <StatCard
                  icon={<Sparkles size={16} style={{ color: '#b45309' }} />}
                  label="XP earned"
                  value={(stats?.total_xp_earned ?? 0).toLocaleString('en-IN')}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Phase 5: Billing panel ──────────────────────────────────────────────────
function BillingPanel({ user, refresh }: { user: SiteUser; refresh: () => Promise<void> }) {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<PaymentEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = async () => {
    try {
      const [s, h] = await Promise.all([
        userApi.myCurrentSubscription(),
        userApi.myPaymentHistory(),
      ]);
      setSub(s);
      setHistory(h);
    } catch {
      // best-effort — billing panel is enrichment, not blocking
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  async function handleCancel() {
    setCancelling(true); setError('');
    try {
      await userApi.cancelSubscription();
      await load();
      await refresh();
      setConfirmCancel(false);
    } catch (err: any) {
      setError(err.message || 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ padding: 24, marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
        <Loader2 size={18} className="spin" style={{ color: '#cbd5e1' }} />
      </div>
    );
  }

  // Not Pro — show upgrade prompt
  if (!user.is_pro || !sub) {
    return (
      <div className="card" style={{ padding: 24, marginBottom: 20, background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)', borderColor: '#bfdbfe' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Crown size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h2 style={{ ...sectionTitle, marginBottom: 4 }}>You&apos;re on the Free plan</h2>
            <p style={{ ...sectionHint, marginBottom: 14 }}>
              Unlock unlimited AI features, streak shields, and the PRO badge.
            </p>
            <Link href="/pricing" className="btn btn-blue btn-sm">
              See Pro plans <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active Pro — show subscription details
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
  const isCancelling = sub.cancel_at_period_end;
  const monthlyDisplay = sub.plan.period === 'yearly'
    ? `₹${Math.round(sub.plan.price_inr / 100 / 12)}/mo (billed yearly)`
    : `₹${Math.round(sub.plan.price_inr / 100)}/mo`;

  return (
    <div className="card" style={{ padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <div>
          <h2 style={sectionTitle}>
            <Crown size={14} style={{ display: 'inline', marginRight: 6, color: '#7c3aed', verticalAlign: -2 }} />
            Pro subscription
          </h2>
          <p style={sectionHint}>{monthlyDisplay}</p>
        </div>
        <span className={`badge ${isCancelling ? 'badge-amber' : 'badge-violet'}`}>
          {isCancelling ? 'CANCELLING' : sub.status.toUpperCase()}
        </span>
      </div>

      {/* Renewal / end-date callout */}
      <div style={{
        background: isCancelling ? '#fffbeb' : '#f8fafc',
        border: `1px solid ${isCancelling ? '#fde68a' : '#e2e8f0'}`,
        borderRadius: 10, padding: 14, marginBottom: 14,
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <Calendar size={16} style={{ color: isCancelling ? '#b45309' : '#475569', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: '#374151' }}>
          {isCancelling ? (
            <>
              Pro access ends on <strong>{periodEnd?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
              No further charges.
            </>
          ) : (
            <>
              Next renewal on <strong>{periodEnd?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
            </>
          )}
        </div>
      </div>

      {/* Payment history */}
      {history.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.06, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Receipt size={12} /> Payment history
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {history.slice(0, 5).map(ev => (
              <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12 }}>
                <span style={{ color: '#475569' }}>
                  {new Date(ev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span style={{
                  color: ev.event_type === 'payment.failed' ? '#dc2626' : '#0f172a',
                  fontWeight: 700,
                }}>
                  {ev.amount_paid_paise ? `₹${(ev.amount_paid_paise / 100).toLocaleString('en-IN')}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel — only if not already cancelling */}
      {!isCancelling && (
        <>
          {!confirmCancel ? (
            <button onClick={() => setConfirmCancel(true)} className="btn btn-outline btn-sm">
              <XCircle size={13} /> Cancel subscription
            </button>
          ) : (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14, marginTop: 4 }}>
              <p style={{ fontSize: 13, color: '#7f1d1d', margin: '0 0 10px', fontWeight: 600 }}>
                Cancel your Pro subscription?
              </p>
              <p style={{ fontSize: 12, color: '#991b1b', margin: '0 0 12px' }}>
                You&apos;ll keep Pro access until <strong>{periodEnd?.toLocaleDateString('en-IN')}</strong>. No more charges after that.
              </p>
              {error && <p style={{ fontSize: 12, color: '#dc2626', margin: '0 0 10px' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCancel} disabled={cancelling} className="btn btn-sm" style={{ background: '#dc2626', color: '#fff' }}>
                  {cancelling ? <Loader2 size={12} className="spin" /> : <XCircle size={12} />}
                  {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                </button>
                <button onClick={() => setConfirmCancel(false)} disabled={cancelling} className="btn btn-sm btn-outline">
                  Keep Pro
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Phase 4: AI usage dashboard ─────────────────────────────────────────────
function AiUsagePanel() {
  const [data, setData] = useState<UsageDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setData(await userApi.myAiUsage()); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ padding: 24, marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
        <Loader2 size={18} className="spin" style={{ color: '#cbd5e1' }} />
      </div>
    );
  }
  if (!data) return null;

  const labels: Record<string, string> = {
    optimizer: 'Resume Optimizer',
    evaluator: 'Answer Evaluator',
    mock_interview: 'Mock Interview',
    revbot: 'RevBot Chat',
  };

  return (
    <div className="card" style={{ padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={sectionTitle}>AI feature usage</h2>
        {data.is_pro ? (
          <span className="badge badge-violet">PRO · Unlimited</span>
        ) : (
          <Link href="/tools" style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
            Upgrade for unlimited →
          </Link>
        )}
      </div>
      <p style={sectionHint}>Free-tier limits reset on their window. Pro users have no caps.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {data.features.map(f => {
          const label = labels[f.feature] || f.feature;
          const pct = f.limit ? Math.min(100, (f.used / f.limit) * 100) : 0;
          const tone: 'green' | 'amber' | 'red' = f.limit
            ? (f.remaining === 0 ? 'red' : f.remaining! <= Math.ceil(f.limit / 5) ? 'amber' : 'green')
            : 'green';
          return (
            <div key={f.feature} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{label}</div>
              {data.is_pro ? (
                <div style={{ fontSize: 12, color: '#64748b' }}>Unlimited</div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                    {f.used} / {f.limit} used {f.window_label}
                  </div>
                  <div style={{ height: 5, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`, height: '100%',
                        background: tone === 'red' ? '#dc2626' : tone === 'amber' ? '#f59e0b' : '#16a34a',
                        transition: 'width .4s ease',
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Phase 3: Privacy / public profile panel ────────────────────────────────
function PrivacyPanel({ user, patchLocal }: { user: SiteUser; patchLocal: (p: Partial<SiteUser>) => void }) {
  const [isPublic, setIsPublic] = useState(user.profile_public);
  const [busy, setBusy] = useState(false);

  const canGoPublic = !!user.username;
  const publicUrl = typeof window !== 'undefined' && user.username ? `${window.location.origin}/u/${user.username}` : '';

  async function toggle(next: boolean) {
    if (next && !canGoPublic) return;
    setBusy(true);
    const prev = isPublic;
    setIsPublic(next);
    try {
      await userApi.updateProfile({ profile_public: next });
      patchLocal({ profile_public: next });
    } catch {
      setIsPublic(prev);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ padding: 24, marginBottom: 20 }}>
      <h2 style={sectionTitle}>Public profile</h2>
      <p style={sectionHint}>
        Make your profile discoverable at <code style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>/u/{user.username || 'yourname'}</code>. Indexed by search engines when public.
      </p>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: busy || !canGoPublic ? 'not-allowed' : 'pointer', opacity: !canGoPublic ? 0.6 : 1 }}>
        <Globe size={18} style={{ color: '#475569', marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
            Make my profile public
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {canGoPublic
              ? 'Shows your name, bio, badges, level, and streak. Hides email and phone.'
              : 'Set a username first to enable a public profile.'}
          </div>
          {canGoPublic && isPublic && publicUrl && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#2563eb', marginTop: 6, textDecoration: 'none', fontWeight: 600 }}>
              View my public profile <ArrowRight size={11} />
            </a>
          )}
        </div>
        <input
          type="checkbox"
          checked={isPublic}
          onChange={e => toggle(e.target.checked)}
          disabled={busy || !canGoPublic}
          style={{ width: 18, height: 18, accentColor: '#2563eb', marginTop: 3 }}
        />
      </label>
    </div>
  );
}
