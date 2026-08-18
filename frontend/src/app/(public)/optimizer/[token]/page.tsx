'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2, AlertCircle, Sparkles, Copy, Check, TrendingUp, ArrowDown, ArrowUp } from 'lucide-react';
import { userApi, type OptimizationResult } from '@/lib/api';

export default function OptimizerResultPage() {
  const params = useParams();
  const token = (params?.token as string) || '';
  const [data, setData] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await userApi.getOptimization(token);
        setData(res.result);
      } catch (err: any) {
        setError(err.message || 'Optimization not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <Centered><Loader2 size={28} className="spin" style={{ color: '#94a3b8' }} /></Centered>;
  if (error || !data) {
    return (
      <Centered>
        <AlertCircle size={28} style={{ color: '#dc2626', marginBottom: 10 }} />
        <p style={{ color: '#64748b', margin: '0 0 16px' }}>{error || 'Not found'}</p>
        <Link href="/tools/resume-optimizer" className="btn btn-blue">Optimize a resume</Link>
      </Centered>
    );
  }

  const delta = data.ats_score_after - data.ats_score_before;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '96px 24px 60px' }}>
      {/* Score comparison hero */}
      <div className="card" style={{ padding: 28, marginBottom: 22, background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)', borderColor: '#bfdbfe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'space-around' }}>
          <ScoreBlock label="Before" value={data.ats_score_before} tone="muted" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <TrendingUp size={26} style={{ color: '#16a34a', marginBottom: 4 }} />
            <span style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>+{delta}</span>
            <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.06, fontWeight: 600 }}>ATS GAIN</span>
          </div>
          <ScoreBlock label="After" value={data.ats_score_after} tone="primary" />
        </div>

        <div style={{ marginTop: 22, padding: '14px 16px', background: '#fff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.06 }}>One-liner pitch</p>
          <p style={{ fontSize: 14, color: '#0f172a', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
            &ldquo;{data.one_liner}&rdquo;
          </p>
        </div>
      </div>

      {/* Optimized summary */}
      <Section title="✨ Optimized professional summary">
        <CopyableBlock text={data.optimized_summary} />
      </Section>

      {/* Rewrote bullets */}
      <Section title={`📝 Rewrote ${data.rewrote_bullets.length} bullets`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.rewrote_bullets.map((b, i) => (
            <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <ArrowDown size={14} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>{b.original}</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <ArrowUp size={14} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 14, color: '#0f172a', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>{b.optimized}</p>
              </div>
              {b.keywords_added.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {b.keywords_added.map(k => (
                    <span key={k} className="tag" style={{ background: '#dcfce7', borderColor: '#bbf7d0', color: '#15803d', fontSize: 10 }}>+ {k}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Keyword comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 18 }}>
        <KeywordList title="✅ Keywords added" items={data.added_keywords} tone="green" />
        <KeywordList title="⚠️ Missing from your resume" items={data.missing_keywords} tone="amber" />
      </div>

      {/* CTA */}
      <div className="card" style={{ padding: 22, marginTop: 22, textAlign: 'center', background: 'linear-gradient(135deg,#fef2f2,#fef3c7)', borderColor: '#fde68a' }}>
        <Sparkles size={20} style={{ color: '#b45309', marginBottom: 8 }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
          Practice for the interview next
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>
          Resume gets you the interview. Mock interview gets you the offer.
        </p>
        <Link href="/tools/mock-interview" className="btn btn-blue btn-sm">
          Start mock interview <ArrowRight size={12} />
        </Link>
      </div>

      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}

function ScoreBlock({ label, value, tone }: { label: string; value: number; tone: 'muted' | 'primary' }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.06 }}>{label}</p>
      <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color: tone === 'primary' ? '#2563eb' : '#94a3b8', letterSpacing: '-0.03em' }}>
        {value}
      </div>
      <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>ATS score</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 22, marginBottom: 14 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>{title}</h2>
      {children}
    </div>
  );
}

function CopyableBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* silent */ }
  }
  return (
    <div style={{ position: 'relative', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
      <p style={{ fontSize: 14, color: '#0f172a', margin: 0, lineHeight: 1.6, paddingRight: 80 }}>{text}</p>
      <button
        onClick={copy}
        className="btn btn-sm btn-outline"
        style={{ position: 'absolute', top: 10, right: 10 }}
      >
        {copied ? <Check size={12} style={{ color: '#16a34a' }} /> : <Copy size={12} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function KeywordList({ title, items, tone }: { title: string; items: string[]; tone: 'green' | 'amber' }) {
  if (items.length === 0) return null;
  const bg = tone === 'green' ? '#f0fdf4' : '#fffbeb';
  const border = tone === 'green' ? '#bbf7d0' : '#fde68a';
  return (
    <div className="card" style={{ padding: 18, background: bg, borderColor: border }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>{title}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map(k => <span key={k} className="tag" style={{ background: '#fff' }}>{k}</span>)}
      </div>
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
