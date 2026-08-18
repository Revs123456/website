/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';

// Next.js OG image generation. Runs on the edge.
// 1200x630 is the standard for LinkedIn/Twitter previews.
export const runtime = 'edge';
export const alt = 'Developer profile on TechChampsByRev';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/v1`;

interface PublicProfile {
  username: string;
  name: string | null;
  level_name: string;
  xp: number;
  is_pro: boolean;
  streak: { current: number };
  badges: { icon: string }[];
}

async function fetchProfile(username: string): Promise<PublicProfile | null> {
  try {
    const res = await fetch(`${BASE}/users/public/${encodeURIComponent(username)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await fetchProfile(username);

  if (!profile) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff', fontSize: 48 }}>
          Profile not found
        </div>
      ),
      { ...size },
    );
  }

  const displayName = profile.name || `@${profile.username}`;
  const initials = displayName.split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
  const topBadges = profile.badges.slice(0, 5);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(135deg,#0f172a 0%,#312e81 50%,#7c3aed 100%)',
          color: '#fff', padding: 80,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, color: '#cbd5e1', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
          TechChampsByRev · Developer Profile
        </div>

        {/* Main */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginTop: 60, flex: 1 }}>
          <div style={{
            width: 180, height: 180, borderRadius: 36, flexShrink: 0,
            background: 'linear-gradient(135deg,#3b82f6,#a78bfa)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 72, fontWeight: 900,
          }}>
            {initials}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>
              {displayName}
            </div>
            <div style={{ fontSize: 32, color: '#cbd5e1', marginTop: 12 }}>
              @{profile.username} {profile.is_pro && ' · PRO'}
            </div>

            <div style={{ display: 'flex', gap: 18, marginTop: 32 }}>
              <Chip bg="#1d4ed8">{profile.level_name}</Chip>
              <Chip bg="#b45309">{profile.xp.toLocaleString('en-IN')} XP</Chip>
              {profile.streak.current > 0 && <Chip bg="#b91c1c">🔥 {profile.streak.current}d streak</Chip>}
            </div>
          </div>
        </div>

        {/* Bottom badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            {topBadges.map((b, i) => (
              <div key={i} style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'rgba(255,255,255,0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 32,
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                {b.icon}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 22, color: '#94a3b8' }}>techchampsbyrev.com</div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Chip({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div style={{ padding: '10px 22px', borderRadius: 99, background: bg, fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
      {children}
    </div>
  );
}
