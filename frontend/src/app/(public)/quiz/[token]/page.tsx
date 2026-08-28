'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Share2, Copy, Check, Loader2, AlertCircle, ArrowRight, Sparkles, Briefcase } from 'lucide-react';
import { userApi, type QuizResult } from '@/lib/api';

export default function QuizResultPage() {
  const params = useParams();
  const token = (params?.token as string) || '';
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await userApi.getQuizResult(token);
        if (!cancelled) setResult(r);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Result not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <Centered><Loader2 size={28} className="spin" style={{ color: '#94a3b8' }} /></Centered>;
  if (error || !result) {
    return (
      <Centered>
        <AlertCircle size={28} style={{ color: '#dc2626', marginBottom: 10 }} />
        <p style={{ color: '#64748b', margin: '0 0 16px' }}>{error}</p>
        <Link href="/tools/career-quiz" className="btn btn-blue">Take the quiz</Link>
      </Centered>
    );
  }

  const label = result.label || result.result_label || 'Developer';
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/quiz/${token}` : '';
  const shareText = `I'm a ${label} ${result.emoji}\n\n${result.blurb}\n\nFind out your archetype: ${shareUrl}`;

  async function share() {
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: `I'm a ${label}`, text: shareText, url: shareUrl }); return; } catch { /* fall through */ }
    }
    copy();
  }
  async function copy() {
    try { await navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* silent */ }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '96px 24px 60px' }}>
      {/* Result card */}
      <div
        style={{
          background: 'linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,var(--brand-violet) 100%)',
          color: '#fff', borderRadius: 20, padding: 36,
          textAlign: 'center', position: 'relative', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(15,23,42,0.2)',
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 88, lineHeight: 1, marginBottom: 14 }}>{result.emoji}</div>
        <p style={{ fontSize: 13, color: '#cbd5e1', margin: '0 0 6px', letterSpacing: 0.06, textTransform: 'uppercase', fontWeight: 600 }}>
          You are
        </p>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.03em' }}>
          {label}
        </h1>

        {/* Traits */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
          {result.traits.map(t => (
            <span key={t} style={{ padding: '5px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 600 }}>
              {t}
            </span>
          ))}
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.65, margin: '0 auto', maxWidth: 480, opacity: 0.95 }}>
          {result.blurb}
        </p>

        <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: 11, opacity: 0.6, letterSpacing: 0.05 }}>
          TECHCHAMPSBYREV · CAREER ARCHETYPE
        </div>
      </div>

      {/* Share */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
        <button onClick={share} className="btn btn-blue">
          <Share2 size={14} /> Share my result
        </button>
        <button onClick={copy} className="btn btn-outline">
          {copied ? <Check size={14} style={{ color: '#16a34a' }} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy text'}
        </button>
      </div>

      {/* Recommended roles */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Briefcase size={16} /> Roles to target
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>
          These job titles match your archetype.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {result.roles.map(r => (
            <span key={r} className="badge badge-blue" style={{ fontSize: 12, padding: '6px 12px' }}>{r}</span>
          ))}
        </div>
      </div>

      {/* Next step CTA */}
      <div className="card" style={{ padding: 22, textAlign: 'center', background: 'linear-gradient(135deg,#fef2f2,#fef3c7)', borderColor: '#fde68a' }}>
        <Sparkles size={20} style={{ color: '#b45309', marginBottom: 8 }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
          Ready to get hired as a {label}?
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>
          Roast your resume against the role, then check the matching jobs.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/tools/resume-roast" className="btn btn-blue btn-sm">
            Roast my resume <ArrowRight size={12} />
          </Link>
          <Link href="/jobs" className="btn btn-outline btn-sm">
            Browse jobs
          </Link>
        </div>
      </div>

      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
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
