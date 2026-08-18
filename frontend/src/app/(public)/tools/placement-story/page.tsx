'use client';
import { useState } from 'react';
import { Trophy, Loader2, AlertCircle, CheckCircle2, Share2, Copy, Check } from 'lucide-react';
import { userApi, type PlacementResult } from '@/lib/api';

export default function PlacementStoryPage() {
  const [form, setForm] = useState({
    name: '', before_role: '', after_role: '',
    company: '', salary_hike: '', story: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PlacementResult | null>(null);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const res = await userApi.submitPlacement({
        name: form.name.trim(),
        before_role: form.before_role.trim(),
        after_role: form.after_role.trim(),
        company: form.company.trim(),
        salary_hike: form.salary_hike.trim() || undefined,
        story: form.story.trim(),
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Could not submit');
    } finally {
      setBusy(false);
    }
  }

  if (result) return <ResultView result={result} form={form} />;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '96px 24px 60px' }}>
      <Hero />

      <form onSubmit={handleSubmit} className="card" style={{ padding: 26 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 14 }}>
          <Field label="Your name" required>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} maxLength={80} required />
          </Field>
          <Field label="Company you joined" required>
            <input className="input" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Razorpay" maxLength={80} required />
          </Field>
          <Field label="Role before" required>
            <input className="input" value={form.before_role} onChange={e => set('before_role', e.target.value)} placeholder="Final year B.Tech student" maxLength={80} required />
          </Field>
          <Field label="Role after" required>
            <input className="input" value={form.after_role} onChange={e => set('after_role', e.target.value)} placeholder="Backend Engineer" maxLength={80} required />
          </Field>
          <Field label="Salary jump (optional)" full>
            <input className="input" value={form.salary_hike} onChange={e => set('salary_hike', e.target.value)} placeholder="₹4L → ₹18L (or '350% hike')" maxLength={60} />
          </Field>
        </div>

        <Field label="Your story" required>
          <textarea
            className="input"
            value={form.story}
            onChange={e => set('story', e.target.value.slice(0, 1500))}
            placeholder="Tell us how it happened — what you studied, what worked, how long it took. AI will polish this into a shareable story (without making anything up)."
            rows={7}
            style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{form.story.length}/1500 · min 20 chars</span>
          </div>
        </Field>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#dc2626', marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={busy || form.story.trim().length < 20} className="btn btn-blue" style={{ width: '100%', justifyContent: 'center', marginTop: 18, opacity: (busy || form.story.trim().length < 20) ? 0.6 : 1 }}>
          {busy ? <Loader2 size={15} className="spin" /> : <Trophy size={15} />}
          {busy ? 'Polishing your story…' : 'Submit my story'}
        </button>

        <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 14 }}>
          Stories go through admin review before appearing on /success-stories.
        </p>
        <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
      </form>
    </div>
  );
}

function ResultView({ result, form }: { result: PlacementResult; form: { name: string; company: string } }) {
  const [copied, setCopied] = useState(false);
  const shareText = `🎉 ${form.name} just got placed at ${form.company}!\n\n"${result.tagline}"\n\nMore stories: https://techchampsbyrev.com/success-stories`;

  async function share() {
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: result.tagline, text: shareText }); return; } catch { /* fall through */ }
    }
    try { await navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* silent */ }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '96px 24px 60px' }}>
      {/* Visual card */}
      <div
        style={{
          background: 'linear-gradient(135deg,#0f172a 0%,#065f46 50%,#16a34a 100%)',
          color: '#fff', borderRadius: 18, padding: 32, textAlign: 'center',
          position: 'relative', overflow: 'hidden', marginBottom: 22,
          boxShadow: '0 24px 60px rgba(15,23,42,0.2)',
        }}
      >
        <div style={{ position: 'absolute', top: -30, right: -20, fontSize: 160, opacity: 0.1, lineHeight: 1 }}>🏆</div>
        <Trophy size={36} style={{ color: '#fde68a', marginBottom: 12 }} />
        <p style={{ fontSize: 12, opacity: 0.7, margin: '0 0 6px', letterSpacing: 0.06, textTransform: 'uppercase', fontWeight: 700 }}>
          Placement Story
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 18px', letterSpacing: '-0.02em' }}>
          {result.tagline}
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.65, margin: '0 auto', maxWidth: 480, opacity: 0.92, fontStyle: 'italic' }}>
          {result.polished_story}
        </p>
        <div style={{ marginTop: 22, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: 11, opacity: 0.6, letterSpacing: 0.05 }}>
          TECHCHAMPSBYREV
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 18, background: '#f0fdf4', borderColor: '#bbf7d0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <CheckCircle2 size={20} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#14532d', margin: '0 0 4px' }}>Submitted for review</h3>
          <p style={{ fontSize: 13, color: '#166534', margin: 0, lineHeight: 1.5 }}>
            {result.message}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button onClick={share} className="btn btn-blue">
          {copied ? <Check size={14} /> : <Share2 size={14} />}
          {copied ? 'Copied to clipboard!' : 'Share my story'}
        </button>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <span className="badge badge-green" style={{ marginBottom: 12 }}>
        <Trophy size={11} style={{ marginRight: 3 }} /> JUST GOT PLACED?
      </span>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
        Share your story
      </h1>
      <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
        We&apos;ll AI-polish it into a clean share-worthy story and feature the best ones on our site.
      </p>
    </div>
  );
}

function Field({ label, children, required, full }: { label: string; children: React.ReactNode; required?: boolean; full?: boolean }) {
  return (
    <div style={full ? { gridColumn: '1 / -1' } : undefined}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      {children}
    </div>
  );
}
