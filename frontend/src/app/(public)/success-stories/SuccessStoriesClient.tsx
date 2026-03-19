'use client';
import { useState } from 'react';
import { ArrowRight, Users, X } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

const AVATAR_COLORS = [
  { c: '#2563eb', bg: '#eff6ff' },
  { c: '#7c3aed', bg: '#f5f3ff' },
  { c: '#059669', bg: '#ecfdf5' },
  { c: '#d97706', bg: '#fffbeb' },
  { c: '#dc2626', bg: '#fef2f2' },
  { c: '#0891b2', bg: '#ecfeff' },
];

function initials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

const EMPTY_FORM = {
  name: '', before_role: '', after_role: '', company: '', salary_hike: '', story: '',
};

export default function SuccessStoriesClient({ stories }: { stories: any[] }) {
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');

  function set(k: keyof typeof EMPTY_FORM, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const body: any = {
        name:        form.name,
        before_role: form.before_role,
        after_role:  form.after_role,
        company:     form.company,
        story:       form.story,
        published:   false,
      };
      if (form.salary_hike) body.salary_hike = form.salary_hike;

      const res = await fetch(`${BASE}/success-stories`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Submission failed');
      setSuccess(true);
      setForm(EMPTY_FORM);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingTop: 80, paddingBottom: 40 }}>
        <div style={wrap}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="badge badge-green" style={{ marginBottom: 12, display: 'inline-flex' }}>
                {stories.length} Stories
              </span>
              <h1 className="text-display-sm">
                Success <span className="grad-blue">Stories</span>
              </h1>
              <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>
                Real transformations from our community
              </p>
            </div>
            <button
              className="btn btn-blue"
              onClick={() => { setShowModal(true); setSuccess(false); setError(''); }}
              style={{ alignSelf: 'flex-end' }}
            >
              Share Your Story
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 40, paddingBottom: 80 }}>
        {stories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <Users size={36} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
            <p>No stories yet. Be the first to share!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {stories.map((s, i) => {
              const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <div key={s.id ?? i} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Author row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: av.bg, color: av.c,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14, flexShrink: 0,
                      border: `2px solid ${av.c}30`,
                    }}>
                      {initials(s.name || '?')}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{s.name}</p>
                      {s.company && (
                        <p style={{ fontSize: 12, color: '#94a3b8' }}>{s.company}</p>
                      )}
                    </div>
                    {s.salary_hike && (
                      <span className="badge badge-green" style={{ marginLeft: 'auto' }}>
                        +{s.salary_hike}
                      </span>
                    )}
                  </div>

                  {/* Role transition */}
                  {(s.before_role || s.after_role) && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                      padding: '10px 14px', borderRadius: 10, background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}>
                      {s.before_role && (
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{s.before_role}</span>
                      )}
                      <ArrowRight size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
                      {s.after_role && (
                        <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 700 }}>{s.after_role}</span>
                      )}
                    </div>
                  )}

                  {/* Story text */}
                  {s.story && (
                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, flex: 1 }}>
                      &ldquo;{s.story}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit Story Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(15,23,42,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{
            background: '#fff', borderRadius: 20, padding: 32,
            width: '100%', maxWidth: 520,
            boxShadow: '0 20px 60px rgba(0,0,0,.18)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>Share Your Story</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {success ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontWeight: 700, color: '#059669', marginBottom: 8 }}>Story Submitted!</h3>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
                  Thank you! Your story will appear after admin review.
                </p>
                <button className="btn btn-blue" onClick={() => setShowModal(false)}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Your Name *
                  </label>
                  <input
                    className="input"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                      Previous Role *
                    </label>
                    <input
                      className="input"
                      required
                      placeholder="e.g. Support Engineer"
                      value={form.before_role}
                      onChange={e => set('before_role', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                      New Role *
                    </label>
                    <input
                      className="input"
                      required
                      placeholder="e.g. Frontend Developer"
                      value={form.after_role}
                      onChange={e => set('after_role', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Company
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Infosys"
                    value={form.company}
                    onChange={e => set('company', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Salary Hike (optional)
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. 80% or ₹8L → ₹14L"
                    value={form.salary_hike}
                    onChange={e => set('salary_hike', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Your Story *
                  </label>
                  <textarea
                    className="input"
                    required
                    rows={5}
                    placeholder="Tell us about your journey, challenges, and what helped you succeed…"
                    value={form.story}
                    onChange={e => set('story', e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {error && (
                  <p style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '10px 14px', borderRadius: 8 }}>
                    {error}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-blue" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit Story'}
                  </button>
                </div>

                <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
                  Stories are reviewed before publishing.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
