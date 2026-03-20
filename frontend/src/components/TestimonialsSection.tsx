'use client';
import { useState } from 'react';
import { Star, PenLine, X, Send, Check } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

const COLORS = [
  { color: '#2563eb', bg: '#eff6ff' },
  { color: '#7c3aed', bg: '#f5f3ff' },
  { color: '#0891b2', bg: '#ecfeff' },
  { color: '#059669', bg: '#ecfdf5' },
  { color: '#d97706', bg: '#fffbeb' },
];

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n} type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        >
          <Star
            size={24}
            fill={(hover || value) >= n ? '#f59e0b' : 'none'}
            style={{ color: (hover || value) >= n ? '#f59e0b' : '#cbd5e1', transition: 'color 0.1s' }}
          />
        </button>
      ))}
    </div>
  );
}

export default function TestimonialsSection({ testimonials }: { testimonials: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', quote: '', package: '', rating: 5 });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.rating === 0) return;
    setSending(true);
    const pick = COLORS[Math.floor(Math.random() * COLORS.length)];
    const initials = form.name.trim().split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    await fetch(`${BASE}/testimonials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, initials, color: pick.color, bg: pick.bg, published: false }),
    });
    setSending(false);
    setSubmitted(true);
    setForm({ name: '', role: '', quote: '', package: '', rating: 5 });
  }

  return (
    <section style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '80px 0' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="badge badge-green" style={{ marginBottom: 12, display: 'inline-flex' }}>Testimonials</span>
          <h2 className="text-display-sm">Developers who made it</h2>
        </div>

        {testimonials.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginBottom: 32 }}>No testimonials yet. Be the first!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 320px))', gap: 16, marginBottom: 40, justifyContent: 'center' }}>
            {testimonials.map((t: any) => (
              <div key={t.id} className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} size={13} fill={n <= (t.rating ?? 5) ? '#f59e0b' : 'none'} style={{ color: n <= (t.rating ?? 5) ? '#f59e0b' : '#cbd5e1' }} />
                  ))}
                </div>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>"{t.quote}"</p>
                <div className="divider" style={{ marginBottom: 16 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.bg || '#eff6ff', color: t.color || '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {t.initials || t.name?.[0] || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{t.role}</p>
                  </div>
                  {t.package && <span className="badge badge-slate">{t.package}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => { setShowForm(true); setSubmitted(false); }}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <PenLine size={14} /> Share your story
          </button>
        </div>
      </div>

      {/* Submission modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Share your experience</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Check size={22} style={{ color: '#059669' }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Thank you!</p>
                <p style={{ fontSize: 13, color: '#94a3b8' }}>Your review has been submitted and will appear after admin approval.</p>
                <button onClick={() => setShowForm(false)} className="btn btn-blue" style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}>Done</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Star rating */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Your rating</label>
                  <StarPicker value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
                  {form.rating === 0 && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>Please select a rating</p>}
                </div>

                {[
                  { label: 'Your name', key: 'name', placeholder: 'Rahul S.', required: true },
                  { label: 'Your role / company', key: 'role', placeholder: 'Frontend Dev @ Zomato', required: true },
                  { label: 'Package used (optional)', key: 'package', placeholder: 'ATS Resume, Premium Package…', required: false },
                ].map(({ label, key, placeholder, required }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
                    <input
                      value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder} required={required}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                ))}

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Your review</label>
                  <textarea
                    value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
                    placeholder="Tell others how TechChampsByRev helped you..." required rows={4}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', resize: 'vertical', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" disabled={sending || form.rating === 0} className="btn btn-blue" style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
                    <Send size={13} /> {sending ? 'Sending…' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
