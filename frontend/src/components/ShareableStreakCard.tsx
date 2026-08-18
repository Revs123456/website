'use client';
import { useState } from 'react';
import { Share2, Copy, Check, Flame, Award } from 'lucide-react';
import { LEVEL_NAMES } from '@/lib/api';

/**
 * Phase 2 share card — a visually appealing chunk that users can:
 *   - Copy text to clipboard (with the platform URL — every share is acquisition)
 *   - Share via Web Share API on mobile (native share sheet — Twitter, WhatsApp, LinkedIn)
 *
 * Phase 3 will upgrade this with html2canvas + OG image generation for
 * pixel-perfect image cards. Phase 2 ships text-share to keep dependencies zero.
 */
export default function ShareableStreakCard({
  streak, xp, level, userName,
}: {
  streak: number;
  xp: number;
  level: number;
  userName: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const levelName = LEVEL_NAMES[Math.max(0, Math.min(level - 1, LEVEL_NAMES.length - 1))];
  const siteUrl = (typeof window !== 'undefined' && window.location.origin) || 'https://techchampsbyrev.com';
  const who = userName || 'I';
  const possessive = userName ? `${userName}'s` : 'My';

  const shareText =
    `${possessive} ${streak}-day daily challenge streak on TechChampsByRev 🔥\n\n` +
    `${who} ${userName ? 'is' : 'am'} a ${levelName} (Lv ${level}) with ${xp.toLocaleString('en-IN')} XP.\n\n` +
    `Take today's challenge → ${siteUrl}/challenges`;

  async function handleShare() {
    // Prefer the native share sheet — works on mobile + some desktops
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `${streak}-day streak on TechChampsByRev`,
          text: shareText,
          url: `${siteUrl}/challenges`,
        });
        return;
      } catch {
        // User cancelled or share unsupported — fall through to copy
      }
    }
    await handleCopy();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — silently no-op */
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      {/* Visual card — what users would screenshot if they want to */}
      <div
        style={{
          background: 'linear-gradient(135deg,#0f172a 0%,#312e81 50%,#7c3aed 100%)',
          color: '#fff', borderRadius: 14, padding: 22,
          textAlign: 'left', position: 'relative', overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(15,23,42,0.15)',
        }}
      >
        {/* Background flame ornament */}
        <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 140, opacity: 0.08, lineHeight: 1, pointerEvents: 'none' }}>
          🔥
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <Flame size={20} style={{ color: '#fb923c' }} />
          <span style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.04em' }}>{streak}</span>
          <span style={{ fontSize: 14, color: '#cbd5e1' }}>day{streak === 1 ? '' : 's'}</span>
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 14px', opacity: 0.95 }}>
          {possessive} daily challenge streak
        </p>

        <div style={{ display: 'flex', gap: 14, fontSize: 12, opacity: 0.9 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Award size={12} /> {levelName} · Lv {level}
          </span>
          <span style={{ opacity: 0.7 }}>·</span>
          <span>{xp.toLocaleString('en-IN')} XP</span>
        </div>

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600, letterSpacing: 0.05 }}>
            TechChampsByRev
          </span>
        </div>
      </div>

      {/* Share buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
        <button onClick={handleShare} className="btn btn-blue btn-sm">
          <Share2 size={13} /> Share my streak
        </button>
        <button onClick={handleCopy} className="btn btn-outline btn-sm">
          {copied ? <Check size={13} style={{ color: '#16a34a' }} /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy text'}
        </button>
      </div>
    </div>
  );
}
