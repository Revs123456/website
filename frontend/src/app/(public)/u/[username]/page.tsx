import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Award, Flame, Github, Linkedin, ExternalLink, Briefcase, Target, Sparkles, Trophy } from 'lucide-react';
import JsonLd from '@/components/JsonLd';

const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/v1`;

interface PublicProfile {
  username: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  experience: string | null;
  current_role: string | null;
  target_role: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  level: number;
  level_name: string;
  xp: number;
  is_pro: boolean;
  member_since: string;
  streak: { current: number; longest: number };
  badges: { code: string; name: string; description: string; icon: string; tier: string; earned_at: string }[];
}

/**
 * Server-side fetch — runs at build (SSG) or per-request (no cache).
 * We don't generate static params (would require knowing usernames at build);
 * Next.js will render on first request and cache via the existing 5m revalidate.
 */
async function fetchProfile(username: string): Promise<PublicProfile | null> {
  try {
    const res = await fetch(`${BASE}/users/public/${encodeURIComponent(username)}`, {
      // SEO benefits from caching the rendered HTML; profile data changes slowly.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchProfile(username);
  if (!profile) return { title: 'Profile not found' };

  const name = profile.name || `@${profile.username}`;
  const role = profile.current_role || profile.target_role || 'Developer';
  const title = `${name} — ${profile.level_name} on TechChampsByRev`;
  const description = profile.bio
    ? profile.bio
    : `${name} is a ${role} working on their career on TechChampsByRev. ${profile.xp.toLocaleString('en-IN')} XP earned · ${profile.badges.length} badges.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'profile' },
    twitter:   { title, description, card: 'summary_large_image' },
    alternates: { canonical: `/u/${profile.username}` },
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await fetchProfile(username);
  if (!profile) notFound();

  const initials = (profile.name || profile.username).split(/\s+/).map((s: string) => s[0]).join('').slice(0, 2).toUpperCase();
  const memberYear = new Date(profile.member_since).getFullYear();

  // schema.org ProfilePage — Google uses this for rich "About" results
  const profileSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    dateCreated: profile.member_since,
    mainEntity: {
      '@type': 'Person',
      name: profile.name || profile.username,
      alternateName: `@${profile.username}`,
      description: profile.bio || `${profile.level_name} on TechChampsByRev`,
      jobTitle: profile.current_role || profile.target_role || undefined,
      sameAs: [profile.github_url, profile.linkedin_url].filter(Boolean),
    },
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '96px 24px 60px' }}>
      <JsonLd data={profileSchema} />
      {/* Header card */}
      <div className="card" style={{ padding: 28, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        {/* Pro shimmer accent */}
        {profile.is_pro && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#7c3aed,#2563eb,#7c3aed)' }} />
        )}

        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div style={{
            width: 88, height: 88, borderRadius: 22, flexShrink: 0,
            background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em',
          }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                {profile.name || `@${profile.username}`}
              </h1>
              {profile.is_pro && <span className="badge badge-violet">PRO</span>}
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px' }}>
              @{profile.username} · Member since {memberYear}
            </p>

            {profile.bio && (
              <p style={{ fontSize: 14, color: '#374151', margin: '0 0 14px', lineHeight: 1.6 }}>
                {profile.bio}
              </p>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-blue"><Award size={11} style={{ marginRight: 3 }} /> {profile.level_name}</span>
              <span className="badge badge-amber"><Sparkles size={11} style={{ marginRight: 3 }} /> {profile.xp.toLocaleString('en-IN')} XP</span>
              {profile.streak.current > 0 && (
                <span className="badge badge-red"><Flame size={11} style={{ marginRight: 3 }} /> {profile.streak.current}-day streak</span>
              )}
              {profile.streak.longest >= 7 && (
                <span className="badge badge-slate"><Trophy size={11} style={{ marginRight: 3 }} /> Best: {profile.streak.longest} days</span>
              )}
            </div>
          </div>
        </div>

        {/* Roles + links */}
        {(profile.current_role || profile.target_role || profile.github_url || profile.linkedin_url) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 22, paddingTop: 22, borderTop: '1px solid #f1f5f9' }}>
            {profile.current_role && (
              <Info icon={<Briefcase size={13} />} label="Current">{profile.current_role}</Info>
            )}
            {profile.target_role && (
              <Info icon={<Target size={13} />} label="Target">{profile.target_role}</Info>
            )}
            {profile.experience && (
              <Info icon={<Award size={13} />} label="Experience">{profile.experience}</Info>
            )}
            {(profile.github_url || profile.linkedin_url) && (
              <div style={{ display: 'flex', gap: 8 }}>
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                    <Github size={13} /> GitHub <ExternalLink size={10} />
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                    <Linkedin size={13} /> LinkedIn <ExternalLink size={10} />
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Badges */}
      {profile.badges.length > 0 ? (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
            Badges · {profile.badges.length}
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 18px' }}>
            Earned by completing challenges, building streaks, and leveling up.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {profile.badges.map(b => (
              <div
                key={b.code}
                title={b.description}
                style={{
                  padding: 14, borderRadius: 10, background: bgFor(b.tier),
                  border: `1px solid ${borderFor(b.tier)}`, textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 6 }}>{b.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{b.name}</div>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.05, fontWeight: 600 }}>
                  {b.tier}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>No badges earned yet.</p>
        </div>
      )}

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: 24, padding: 20 }}>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 10px' }}>
          Want a profile like this?
        </p>
        <Link href="/tools/career-quiz" className="btn btn-blue">
          Start your journey
        </Link>
      </div>
    </div>
  );
}

function Info({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 3, letterSpacing: 0.04, textTransform: 'uppercase' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{children}</div>
    </div>
  );
}

function bgFor(tier: string) {
  switch (tier) {
    case 'platinum': return 'linear-gradient(135deg,#ecfeff,#cffafe)';
    case 'gold':     return 'linear-gradient(135deg,#fffbeb,#fef3c7)';
    case 'silver':   return 'linear-gradient(135deg,#f8fafc,#e2e8f0)';
    default:         return 'linear-gradient(135deg,#fef3c7,#fed7aa)';
  }
}
function borderFor(tier: string) {
  switch (tier) {
    case 'platinum': return '#67e8f9';
    case 'gold':     return '#fde68a';
    case 'silver':   return '#cbd5e1';
    default:         return '#fdba74';
  }
}
