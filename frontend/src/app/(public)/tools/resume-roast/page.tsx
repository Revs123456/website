'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Upload, FileText, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { userApi } from '@/lib/api';

type Mode = 'paste' | 'upload';

export default function ResumeRoastPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('paste');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const MIN = 50, MAX = 20000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const res = mode === 'paste'
        ? await userApi.createRoastFromText(text)
        : await userApi.createRoastFromPdf(file!);
      router.push(`/roast/${res.share_token}`);
    } catch (err: any) {
      setError(err.message || 'Could not roast — please try again.');
      setBusy(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('File too large (max 5MB).'); return; }
    if (!f.type.includes('pdf')) { setError('Please upload a PDF.'); return; }
    setError(''); setFile(f);
  }

  const canSubmit = mode === 'paste'
    ? text.trim().length >= MIN
    : file !== null;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '96px 24px 60px' }}>
      <Hero />

      <form onSubmit={handleSubmit} className="card" style={{ padding: 26 }}>
        {/* Tabs */}
        <div role="tablist" style={{ display: 'flex', gap: 4, padding: 4, background: '#f1f5f9', borderRadius: 10, marginBottom: 18 }}>
          {(['paste', 'upload'] as Mode[]).map(m => (
            <button
              type="button"
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '8px 14px', borderRadius: 7,
                border: 'none', cursor: 'pointer',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#0f172a' : '#64748b',
                fontSize: 13, fontWeight: 600,
                boxShadow: mode === m ? '0 1px 4px rgba(15,23,42,0.06)' : 'none',
              }}
            >
              {m === 'paste' ? <><FileText size={13} style={{ marginRight: 6, verticalAlign: -2 }} /> Paste text</> : <><Upload size={13} style={{ marginRight: 6, verticalAlign: -2 }} /> Upload PDF</>}
            </button>
          ))}
        </div>

        {mode === 'paste' ? (
          <>
            <textarea
              className="input"
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX))}
              placeholder="Paste your full resume here — name, education, experience bullets, projects, skills, everything."
              rows={14}
              style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{text.length} / {MAX}</span>
              {text.length > 0 && text.length < MIN && (
                <span style={{ fontSize: 11, color: '#dc2626' }}>{MIN - text.length} more chars</span>
              )}
            </div>
          </>
        ) : (
          <div>
            <input ref={fileRef} type="file" accept="application/pdf" onChange={onFile} style={{ display: 'none' }} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', padding: 36, borderRadius: 12,
                border: `2px dashed ${file ? '#16a34a' : '#cbd5e1'}`,
                background: file ? '#f0fdf4' : '#f8fafc',
                cursor: 'pointer', textAlign: 'center', transition: 'all .15s',
              }}
            >
              <Upload size={28} style={{ color: file ? '#16a34a' : '#64748b', marginBottom: 8 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: file ? '#14532d' : '#0f172a', marginBottom: 4 }}>
                {file ? file.name : 'Click to upload your resume'}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                PDF up to 5MB · Text-based PDFs only (no scans)
              </div>
            </button>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !canSubmit}
          className="btn btn-blue"
          style={{ width: '100%', justifyContent: 'center', marginTop: 18, opacity: (busy || !canSubmit) ? 0.6 : 1 }}
        >
          {busy ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
          {busy ? 'Roasting your resume…' : 'Roast my resume'}
        </button>

        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 14, textAlign: 'center' }}>
          3 free roasts per day · No signup required · We don&apos;t store your resume publicly
        </p>
        <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
      </form>
    </div>
  );
}

function Hero() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 11, fontWeight: 700, letterSpacing: 0.05, textTransform: 'uppercase', marginBottom: 14 }}>
        <Flame size={11} /> AI-Powered · Brutally Honest
      </div>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', margin: '0 0 10px', letterSpacing: '-0.03em' }}>
        Resume Roast
      </h1>
      <p style={{ fontSize: 15, color: '#64748b', margin: 0, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
        We&apos;ll roast your resume in 10 seconds — score it 0–100, call out the weak spots, and tell you exactly how to fix it. Then you can share the roast on LinkedIn (if you dare).
      </p>
    </div>
  );
}
