'use client';
import Link from 'next/link';
import { Award, Crown, Flame, Trophy, MessageSquare, CheckCircle2, Sparkles } from 'lucide-react';
import type { ActivityEventRow } from '@/lib/api';

/**
 * Renders a single activity event row.
 * Switches on event.type to format the content properly.
 * Shared between /dashboard and the global activity feed.
 */
export default function ActivityFeedItem({ event, showUser = false }: {
  event: ActivityEventRow;
  showUser?: boolean;
}) {
  const md = event.metadata || {};
  const userName = event.user?.name || event.user?.username || 'Someone';
  const userLink = event.user?.username ? `/u/${event.user.username}` : null;

  const { icon, message, link } = renderEvent(event.type, md, userName);

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: '#f1f5f9', color: '#475569',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: '#0f172a', margin: 0, lineHeight: 1.5 }}>
          {showUser && userLink ? (
            <Link href={userLink} style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
              {userName}
            </Link>
          ) : showUser ? (
            <strong style={{ color: '#0f172a' }}>{userName}</strong>
          ) : null}
          {showUser && ' '}
          {message}
          {event.user?.is_pro && showUser && (
            <span className="badge badge-violet" style={{ marginLeft: 6, fontSize: 9, padding: '1px 5px' }}>PRO</span>
          )}
        </p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
          {timeAgo(event.created_at)}
          {link && (
            <>
              {' · '}
              <Link href={link.href} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                {link.label}
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function renderEvent(type: string, md: any, userName: string): {
  icon: React.ReactNode;
  message: React.ReactNode;
  link?: { href: string; label: string };
} {
  switch (type) {
    case 'level_up':
      return {
        icon: <Award size={16} style={{ color: '#7c3aed' }} />,
        message: <>reached <strong>{md.level_name}</strong> (Lv {md.new_level})</>,
      };
    case 'badge_earned':
      return {
        icon: <span style={{ fontSize: 16 }}>{md.icon || '🏆'}</span>,
        message: <>earned the <strong>{md.badge_name}</strong> badge</>,
      };
    case 'streak_milestone':
      return {
        icon: <Flame size={16} style={{ color: '#dc2626' }} />,
        message: <>hit a <strong>{md.days}-day streak</strong></>,
      };
    case 'mock_interview_aced':
      return {
        icon: <Trophy size={16} style={{ color: '#b45309' }} />,
        message: <>scored <strong>{md.score}/100</strong> on a {md.role} mock interview{md.company ? ` (${md.company})` : ''}</>,
        link: md.share_token ? { href: `/mock-interview/${md.share_token}`, label: 'View result' } : undefined,
      };
    case 'pro_subscribed':
      return {
        icon: <Crown size={16} style={{ color: '#7c3aed' }} />,
        message: <>went Pro 🎉</>,
      };
    case 'placement_reported':
      return {
        icon: <Sparkles size={16} style={{ color: '#16a34a' }} />,
        message: <>just got placed at <strong>{md.company}</strong>!</>,
      };
    case 'answer_accepted':
      return {
        icon: <CheckCircle2 size={16} style={{ color: '#15803d' }} />,
        message: <>had their answer accepted on a community question</>,
        link: md.question_id ? { href: `/community/${md.question_id}`, label: 'See question' } : undefined,
      };
    default:
      return {
        icon: <MessageSquare size={16} style={{ color: '#64748b' }} />,
        message: <>did something noteworthy</>,
      };
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
