'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Flame, AlertCircle, Loader2, Share2, Copy, Check, ArrowRight, Sparkles } from 'lucide-react';
import { userApi, type ResumeRoastResult } from '@/lib/api';

const VERDICT_META: Record<string, { label: string; bg: string; color: string }> = {
  savage: { label: 'Savage', bg: '#fef2f2', color: '#b91c1c' },
  salty:  { label: 'Salty',  bg: '#fef3c7', color: '#92400e' },
  spicy:  { label: 'Spicy',  bg: '#ffedd5', color: '#9a3412' },
  mid:    { label: 'Mid',    bg: '#f1f5f9', color: '#475569' },
  solid:  { label: 'Solid',  bg: '#ecfeff', color: '#0e7490' },
  elite:  { label: 'Elite',  bg: '#f0fdf4', color: '#15803d' },
};

export default function RoastResultPage() {
  const params = useParams();
  const token = (params?.token as string) || '';
  const [data, setData] = useState<ResumeRoastResult['result'] & { score: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await userApi.getRoast(token);
        if (!cancelled) setData({ ...r.result, score: r.score });
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Roast not found.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return <Centered><Loader2 size={28} className="spin" style={{ color: '#94a3b8' }} /></Centered>;
  }

  if (error || !data) {
    return (
      <Centered>
        <AlertCircle size={28} style={{ color: '#dc2626', marginBottom: 10 }} />
        <p style={{ color: '#64748b', margin: '0 0 16px' }}>{error || 'This roast no longer exists.'}</p>
        <Link href="/tools/resume-roast" className="btn btn-blue">Get your own roast</Link>
      </Centered>
    );
  }

  const verdict = VERDICT_META[data.verdict] || VERDICT_META.mid;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/roast/${token}` : '';
  const shareText = `My resume got "${verdict.label}" with ${data.score}/100 on the TechChampsByRev Resume Roast 🔥\n\n"${data.one_liner}"\n\nGet roasted: ${shareUrl}`;

  async function share() {
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: 'My resume got roasted', text: shareText, url: shareUrl }); return; } catch { /* fall through */ }
    }
    copy();
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '96px 24px 60px' }}>
      {/* Score card — the shareable centerpiece */}
      <div
        style={{
          background: 'linear-gradient(135deg,#0f172a 0%,#7f1d1d 50%,#ea580c 100%)',
          color: '#fff', borderRadius: 18, padding: 32,
          textAlign: 'center', position: 'relative', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(15,23,42,0.25)',
          marginBottom: 24,
        }}
      >
        {/* Flame ornament */}
        <div style={{ position: 'absolute', top: -30, right: -10, fontSize: 200, opacity: 0.07, lineHeight: 1, pointerEvents: 'none' }}>🔥</div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: verdict.bg, color: verdict.color, fontSize: 11, fontWeight: 800, letterSpacing: 0.06, textTransform: 'uppercase', marginBottom: 16 }}>
          <Flame size={11} /> {verdict.label}
        </div>

        <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 4 }}>
          {data.score}
        </div>
        <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 20 }}>out of 100</div>

        <p style={{ fontSize: 18, fontWeight: 600, margin: '0 auto', maxWidth: 480, opacity: 0.95, fontStyle: 'italic' }}>
          &ldquo;{data.one_liner}&rdquo;
        </p>

        <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: 11, opacity: 0.7, letterSpacing: 0.05 }}>
          TECHCHAMPSBYREV · RESUME ROAST
        </div>
      </div>

      {/* Share buttons */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
        <button onClick={share} className="btn btn-blue">
          <Share2 size={14} /> Share my roast
        </button>
        <button onClick={copy} className="btn btn-outline">
          {copied ? <Check size={14} style={{ color: '#16a34a' }} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy text'}
        </button>
      </div>

      {/* Roasts */}
      <Section title="🔥 The Roasts" tint="#fef2f2" border="#fecaca">
        {data.roasts.map((r, i) => (
          <Bullet key={i} num={i + 1} text={r} />
        ))}
      </Section>

      {/* Fixes */}
      <Section title="✅ The Fixes" tint="#f0fdf4" border="#bbf7d0">
        {data.fixes.map((f, i) => (
          <Bullet key={i} num={i + 1} text={f} />
        ))}
      </Section>

      {/* CTA — quiz/profile cross-link */}
      <div className="card" style={{ padding: 22, textAlign: 'center', marginTop: 20, background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)', borderColor: '#bfdbfe' }}>
        <Sparkles size={20} style={{ color: '#7c3aed', marginBottom: 8 }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
          Want to know which tech career fits you?
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>
          Take our 2-minute archetype quiz.
        </p>
        <Link href="/tools/career-quiz" className="btn btn-blue btn-sm">
          Take the quiz <ArrowRight size={12} />
        </Link>
      </div>

      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}

function Section({ title, tint, border, children }: { title: string; tint: string; border: string; children: React.ReactNode }) {
  return (
    <div style={{ background: tint, border: `1px solid ${border}`, borderRadius: 12, padding: 22, marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  );
}

function Bullet({ num, text }: { num: number; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        flexShrink: 0, width: 24, height: 24, borderRadius: 99,
        background: '#fff', color: '#475569', fontSize: 12, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid #e2e8f0',
      }}>{num}</div>
      <p style={{ fontSize: 14, color: '#0f172a', margin: 0, lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
      {children}
      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}
