'use client';
import { useState } from 'react';
import { Star, PenLine, X, Send, Check } from 'lucide-react';
import { useAdminSync } from '@/hooks/useAdminSync';

const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/v1`;

const COLORS = [
  { color: '#2563eb', bg: '#eff6ff' },
  { color: 'var(--brand-violet)', bg: '#f5f3ff' },
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

export default function TestimonialsSection({ testimonials: initialTestimonials }: { testimonials: any[] }) {
  // Seeded from the server-rendered prop for a fast first paint, then kept
  // live — the prop itself is fetched once at page-render time and can't
  // update on its own, so without this an admin hiding/showing a testimonial
  // never reaches anyone already on the homepage until they hard-refresh.
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', role: '', quote: '', package: '', rating: 5 });

  useAdminSync(() => {
    fetch(`${BASE}/testimonials/published`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (Array.isArray(data)) setTestimonials(data); })
      .catch(() => {});
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.rating === 0) return;
    setSending(true);
    setError('');
    const pick = COLORS[Math.floor(Math.random() * COLORS.length)];
    const initials = form.name.trim().split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    try {
      // Public submit endpoint — no auth. The old code posted straight to
      // POST /testimonials, which requires an admin session and always
      // returned 401 for a real visitor; this "worked" was actually always
      // silently failing since it never checked the response.
      const res = await fetch(`${BASE}/testimonials/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, initials, color: pick.color, bg: pick.bg }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitted(true);
      setForm({ name: '', role: '', quote: '', package: '', rating: 5 });
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setSending(false);
    }
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
          <div
            className="testimonial-marquee"
            style={{
              overflow: 'hidden', marginBottom: 40,
              maskImage: 'linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)',
              WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)',
            }}
          >
            <div className="testimonial-track" style={{ display: 'flex', gap: 16, width: 'max-content' }}>
              {/* Rendered twice back-to-back — the animation scrolls exactly one
                  copy's width (-50%) then snaps to 0, so the loop is seamless. */}
              {[...testimonials, ...testimonials].map((t: any, i: number) => (
                <div key={`${t.id}-${i}`} className="card" style={{ padding: 24, width: 300, flexShrink: 0 }}>
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
            <style>{`
              @keyframes testimonial-scroll {
                from { transform: translateX(0); }
                to   { transform: translateX(-50%); }
              }
              .testimonial-track {
                animation: testimonial-scroll 45s linear infinite;
              }
              .testimonial-marquee:hover .testimonial-track {
                animation-play-state: paused;
              }
              @media (prefers-reduced-motion: reduce) {
                .testimonial-track { animation: none; }
              }
            `}</style>
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
                {error && (
                  <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12 }}>
                    {error}
                  </div>
                )}
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
