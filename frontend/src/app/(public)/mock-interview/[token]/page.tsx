'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, Share2, Copy, Check, ChevronDown, ChevronUp, ArrowRight, Trophy } from 'lucide-react';
import { userApi, type MockInterviewScores } from '@/lib/api';

interface InterviewData {
  share_token: string;
  role: string;
  company: string | null;
  difficulty: string;
  scores: MockInterviewScores;
  transcript: { role: 'user' | 'assistant'; content: string; ts: string }[];
  completed_at: string;
}

export default function MockInterviewResultPage() {
  const params = useParams();
  const token = (params?.token as string) || '';
  const [data, setData] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await userApi.getMockInterviewByToken(token);
        setData(r);
      } catch (err: any) {
        setError(err.message || 'Interview not found');
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
        <p style={{ color: '#64748b', margin: '0 0 16px' }}>{error}</p>
        <Link href="/tools/mock-interview" className="btn btn-blue">Start an interview</Link>
      </Centered>
    );
  }

  const { scores } = data;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/mock-interview/${token}` : '';
  const shareText = `I scored ${scores.overall}/100 on a ${data.role} mock interview${data.company ? ` at ${data.company}` : ''} on TechChampsByRev 🎯\n\nTry it: ${shareUrl}`;

  async function share() {
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: `${scores.overall}/100 mock interview`, text: shareText, url: shareUrl }); return; } catch { /* fall through */ }
    }
    try { await navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* silent */ }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '96px 24px 60px' }}>
      {/* Hero score card */}
      <div
        style={{
          background: 'linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,var(--brand-violet) 100%)',
          color: '#fff', borderRadius: 20, padding: 36, textAlign: 'center',
          position: 'relative', overflow: 'hidden', marginBottom: 22,
          boxShadow: '0 24px 60px rgba(15,23,42,0.2)',
        }}
      >
        <div style={{ position: 'absolute', top: -30, right: -10, fontSize: 200, opacity: 0.07, lineHeight: 1 }}>🎯</div>

        <p style={{ fontSize: 12, opacity: 0.7, margin: '0 0 4px', letterSpacing: 0.06, textTransform: 'uppercase', fontWeight: 700 }}>
          Mock Interview Result
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 20px', opacity: 0.92 }}>
          {data.role}{data.company ? ` · ${data.company}` : ''}
        </h1>

        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 6 }}>
          {scores.overall}
        </div>
        <p style={{ fontSize: 14, opacity: 0.7, margin: '0 0 24px' }}>out of 100</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <SubScore label="Technical" value={scores.technical} />
          <SubScore label="Communication" value={scores.communication} />
        </div>

        <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: 11, opacity: 0.6, letterSpacing: 0.05 }}>
          TECHCHAMPSBYREV · MOCK INTERVIEW
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
        <button onClick={share} className="btn btn-blue">
          {copied ? <Check size={14} /> : <Share2 size={14} />}
          {copied ? 'Copied!' : 'Share my score'}
        </button>
      </div>

      {/* Summary */}
      <div className="card" style={{ padding: 22, marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Trophy size={15} /> Summary
        </h2>
        <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.7 }}>
          {scores.summary}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <FeedbackBlock title="✨ Strengths" items={scores.strengths} tone="green" />
        <FeedbackBlock title="🎯 Improvements" items={scores.improvements} tone="amber" />
      </div>

      {/* Transcript collapsible */}
      <div className="card" style={{ padding: 0, marginTop: 14, overflow: 'hidden' }}>
        <button
          onClick={() => setTranscriptOpen(o => !o)}
          style={{
            width: '100%', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', padding: 18, background: 'transparent',
            border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#0f172a',
          }}
        >
          <span>Full transcript ({data.transcript.length} messages)</span>
          {transcriptOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {transcriptOpen && (
          <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.transcript.map((t, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 8, background: t.role === 'user' ? '#eff6ff' : '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.05 }}>
                  {t.role === 'user' ? 'You' : 'AI Interviewer'}
                </div>
                <div style={{ fontSize: 13, color: '#0f172a', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{t.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Link href="/tools/mock-interview" className="btn btn-outline">
          Run another interview <ArrowRight size={12} />
        </Link>
      </div>

      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}

function SubScore({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: 10 }}>
      <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.05, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function FeedbackBlock({ title, items, tone }: { title: string; items: string[]; tone: 'green' | 'amber' }) {
  const bg = tone === 'green' ? '#f0fdf4' : '#fffbeb';
  const border = tone === 'green' ? '#bbf7d0' : '#fde68a';
  return (
    <div className="card" style={{ padding: 18, background: bg, borderColor: border }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((s, i) => (
          <div key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
            • {s}
          </div>
        ))}
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
