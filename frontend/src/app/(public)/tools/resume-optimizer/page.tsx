'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Sparkles, Loader2, AlertCircle, Lock, ArrowRight } from 'lucide-react';
import { userApi } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import AuthModal from '@/components/AuthModal';

export default function ResumeOptimizerPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  const RESUME_MIN = 100, RESUME_MAX = 20000;
  const JD_MIN = 50, JD_MAX = 10000;
  const canSubmit = resumeText.trim().length >= RESUME_MIN && jdText.trim().length >= JD_MIN;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { setAuthOpen(true); return; }
    setError(''); setBusy(true);
    try {
      const res = await userApi.optimizeResume(resumeText, jdText);
      router.push(`/optimizer/${res.share_token}`);
    } catch (err: any) {
      setError(err.message || 'Optimization failed');
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '96px 24px 60px' }}>
      <Hero />

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        <TextArea
          label="Your resume (paste full text)"
          value={resumeText}
          onChange={setResumeText}
          min={RESUME_MIN}
          max={RESUME_MAX}
          rows={14}
          placeholder="Paste your entire resume — education, experience, projects, skills. The more we have, the better the rewrite."
        />
        <TextArea
          label="Job description"
          value={jdText}
          onChange={setJdText}
          min={JD_MIN}
          max={JD_MAX}
          rows={14}
          placeholder="Paste the JD you're targeting. We'll weave its keywords into your bullets without inventing experience."
        />
      </form>

      {error && (
        <div style={{ marginTop: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleSubmit}
          disabled={busy || (!canSubmit && !!user)}
          className="btn btn-blue btn-lg"
          style={{ minWidth: 280, opacity: (busy || (!canSubmit && !!user)) ? 0.6 : 1 }}
        >
          {busy ? <Loader2 size={16} className="spin" /> : !user ? <Lock size={15} /> : <Sparkles size={15} />}
          {busy ? 'Optimizing… (~10s)' : !user ? 'Sign in to optimize' : 'Optimize my resume'}
        </button>
      </div>
      {!userLoading && !user && (
        <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>
          Free tier: 1 optimization per day · Pro: unlimited
        </p>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" />
      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}

function Hero() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <span className="badge badge-blue" style={{ marginBottom: 12 }}>
        <Sparkles size={11} style={{ marginRight: 3 }} /> AI RESUME OPTIMIZER
      </span>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', margin: '0 0 10px', letterSpacing: '-0.03em' }}>
        Match any JD
      </h1>
      <p style={{ fontSize: 15, color: '#64748b', margin: 0, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
        Paste your resume + the job description. Our AI rewrites your bullets to mirror the JD&apos;s language — without inventing experience you don&apos;t have.
      </p>
    </div>
  );
}

function TextArea({ label, value, onChange, min, max, rows, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number; max: number; rows: number;
  placeholder: string;
}) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
        <FileText size={13} /> {label}
      </label>
      <textarea
        className="input"
        value={value}
        onChange={e => onChange(e.target.value.slice(0, max))}
        placeholder={placeholder}
        rows={rows}
        style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{value.length}/{max}</span>
        {value.length > 0 && value.length < min && (
          <span style={{ fontSize: 11, color: '#dc2626' }}>{min - value.length} more chars</span>
        )}
      </div>
    </div>
  );
}
