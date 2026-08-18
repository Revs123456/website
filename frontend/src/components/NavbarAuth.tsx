'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, ChevronDown, User as UserIcon, LogOut, Settings as SettingsIcon, Flame, Award, LayoutGrid, Briefcase, Bookmark } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { LEVEL_NAMES } from '@/lib/api';
import AuthModal from './AuthModal';

/**
 * Slot dropped into the Navbar that renders one of three states:
 *   - hydrating  → tiny skeleton chip (prevents login-button flash on logged-in reload)
 *   - logged out → "Sign in" button that opens AuthModal
 *   - logged in  → avatar with dropdown (account, log out)
 *
 * Self-contained on purpose — Navbar.tsx already has its own complex state
 * (mobile, dropdowns, scroll) and we don't want to tangle auth into it.
 */
export default function NavbarAuth({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const router = useRouter();
  const { user, loading, logout } = useUser();
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Skeleton: a fixed-width chip while we hydrate so navbar layout doesn't jump
  if (loading) {
    return (
      <div style={{
        width: variant === 'mobile' ? '100%' : 92,
        height: 32,
        borderRadius: 8,
        background: 'linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9)',
        backgroundSize: '200% 100%',
        animation: '_shimmer 1.5s ease-in-out infinite',
      }}>
        <style>{`@keyframes _shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }`}</style>
      </div>
    );
  }

  // Logged out → Sign in trigger
  if (!user) {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className={variant === 'mobile' ? 'btn btn-blue' : 'btn btn-outline btn-sm'}
          style={variant === 'mobile' ? { width: '100%', justifyContent: 'center' } : undefined}
        >
          <LogIn size={14} /> Sign in
        </button>
        <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  // Logged in → avatar + dropdown
  const initials = (user.name || user.email).split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();

  // Mobile: render a full-width row instead of a dropdown
  if (variant === 'mobile') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        <Link
          href="/account"
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none' }}
        >
          <Avatar initials={initials} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name || 'Your account'}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>
        </Link>
        <button
          className="btn btn-outline"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={async () => { await logout(); router.push('/'); }}
        >
          <LogOut size={14} /> Log out
        </button>
      </div>
    );
  }

  // Desktop dropdown
  const streak = user.streak?.current_streak ?? 0;
  const levelName = LEVEL_NAMES[Math.max(0, Math.min(user.level - 1, LEVEL_NAMES.length - 1))];
  const last = user.streak?.last_activity_date;
  const today = istTodayStringClient();
  const yesterday = istYesterdayStringClient();
  // Streak counts as active if last activity was today; "at risk" if yesterday
  // (user must come back today). Mirrors the backend `at_risk` logic.
  const streakActiveToday = last === today;
  const streakAtRisk = !streakActiveToday && last === yesterday && streak > 0;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Streak chip — only shown when user has a streak going */}
      {streak > 0 && (
        <Link
          href="/challenges"
          title={streakAtRisk ? `Streak at risk — take today's challenge!` : `${streak}-day streak`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700,
            textDecoration: 'none',
            color: streakAtRisk ? '#b91c1c' : '#b45309',
            background: streakAtRisk ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${streakAtRisk ? '#fecaca' : '#fde68a'}`,
            animation: streakAtRisk ? '_streakPulse 1.6s ease-in-out infinite' : undefined,
          }}
        >
          <Flame size={12} /> {streak}
        </Link>
      )}

      {/* Level chip — always shown for logged-in users */}
      <Link
        href="/account"
        title={`${levelName} — Level ${user.level} · ${user.xp} XP`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '5px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700,
          textDecoration: 'none', color: '#1d4ed8', background: '#eff6ff',
          border: '1px solid #bfdbfe',
        }}
      >
        <Award size={12} /> Lv {user.level}
      </Link>

      <button
        onClick={() => setMenuOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 10px 4px 4px', borderRadius: 24,
          background: menuOpen ? '#f1f5f9' : 'transparent',
          border: '1px solid #e2e8f0', cursor: 'pointer',
          transition: 'background .15s',
        }}
      >
        <Avatar initials={initials} size={26} />
        <ChevronDown size={13} style={{ color: '#64748b', transition: 'transform .2s', transform: menuOpen ? 'rotate(180deg)' : 'none' }} />
      </button>

      {menuOpen && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
            boxShadow: '0 12px 40px rgba(15,23,42,0.1)',
            minWidth: 220, padding: 6, zIndex: 60,
          }}
        >
          <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name || 'Your account'}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>
          <MenuItem href="/dashboard" icon={<LayoutGrid size={14} />} onClick={() => setMenuOpen(false)}>
            Dashboard
          </MenuItem>
          <MenuItem href="/applications" icon={<Briefcase size={14} />} onClick={() => setMenuOpen(false)}>
            Application tracker
          </MenuItem>
          <MenuItem href="/saved-jobs" icon={<Bookmark size={14} />} onClick={() => setMenuOpen(false)}>
            Saved jobs
          </MenuItem>
          <MenuItem href="/account" icon={<UserIcon size={14} />} onClick={() => setMenuOpen(false)}>
            Profile
          </MenuItem>
          <MenuItem href="/account" icon={<SettingsIcon size={14} />} onClick={() => setMenuOpen(false)}>
            Settings
          </MenuItem>
          <button
            onClick={async () => { setMenuOpen(false); await logout(); router.push('/'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
              padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, color: '#dc2626', background: 'transparent',
            }}
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

// ── IST date helpers (mirror backend engagement.constants.ts) ──────────────
// Used to decide whether the navbar streak chip should pulse red ("at risk").
function istTodayStringClient(): string {
  const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
function istYesterdayStringClient(): string {
  const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function Avatar({ initials, size = 30 }: { initials: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size < 28 ? 11 : 12, fontWeight: 700, letterSpacing: '-0.02em',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function MenuItem({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick?: () => void }) {
  return (
    <>
      <Link
        href={href}
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 8, textDecoration: 'none',
          fontSize: 13, fontWeight: 500, color: '#475569',
        }}
      >
        {icon} {children}
      </Link>
      {/* Streak pulse animation — only declared once but harmless if duplicated */}
      <style>{`
        @keyframes _streakPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.0); }
          50%      { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.15); }
        }
      `}</style>
    </>
  );
}
