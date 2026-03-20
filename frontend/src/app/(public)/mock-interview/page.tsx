'use client';
import { useState } from 'react';
import BackButton from '@/components/BackButton';
import { CheckCircle2, Calendar, Video, Mic, Lightbulb } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

const BENEFITS = [
  { icon: Mic,          label: 'Realistic Questions',  desc: 'Domain-specific questions from real interviews' },
  { icon: Video,        label: 'Expert Feedback',       desc: 'Detailed feedback from senior engineers' },
  { icon: Calendar,     label: 'Recorded Session',      desc: 'Full recording to review your performance' },
  { icon: Lightbulb,    label: 'Actionable Tips',       desc: 'Personalized improvement plan after each session' },
];

const EMPTY_FORM = {
  name: '', email: '', phone: '', experience: '', role: '',
  preferred_date: '', preferred_time: '', notes: '',
};

export default function MockInterviewPage() {
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');

  function set(k: keyof typeof EMPTY_FORM, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${BASE}/bookings`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           form.name,
          email:          form.email,
          phone:          form.phone || undefined,
          experience:     form.experience,
          role:           form.role,
          preferred_date: form.preferred_date,
          preferred_time: form.preferred_time,
          notes:          form.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
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
        <div style={wrap}><BackButton /></div>
        <div style={{ ...wrap, maxWidth: 640 }}>
          <span className="badge badge-blue" style={{ marginBottom: 12, display: 'inline-flex' }}>
            Free First Session
          </span>
          <h1 className="text-display-sm">
            Book a <span className="grad-blue">Mock Interview</span>
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>
            Practice with real engineers. Get hired faster.
          </p>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 48, paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, alignItems: 'start' }}>
          {/* Benefits */}
          <div>
            <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 17, marginBottom: 24 }}>
              Why book a mock interview?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {BENEFITS.map(({ icon: Icon, label, desc }) => (
                <div key={label} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: '#eff6ff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={18} style={{ color: '#2563eb' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, marginBottom: 3 }}>{label}</p>
                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 32, padding: '20px 24px', borderRadius: 14,
              background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
              border: '1px solid #bfdbfe',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>
                100+ Sessions Conducted
              </p>
              <p style={{ fontSize: 12, color: '#3b82f6' }}>
                Avg rating 4.8/5 from candidates. 73% received offers within 60 days.
              </p>
            </div>
          </div>

          {/* Booking form */}
          <div>
            {submitted ? (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: '#ecfdf5', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <CheckCircle2 size={32} style={{ color: '#059669' }} />
                </div>
                <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: 18, marginBottom: 10 }}>
                  Booking Confirmed!
                </h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                  We&apos;ll contact you within 24 hours to confirm your session details.
                </p>
                <button
                  className="btn btn-blue"
                  style={{ marginTop: 24 }}
                  onClick={() => { setSubmitted(false); setForm(EMPTY_FORM); }}
                >
                  Book Another Session
                </button>
              </div>
            ) : (
              <div className="card" style={{ padding: 28 }}>
                <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: 15, marginBottom: 20 }}>
                  Fill in your details
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                        Full Name *
                      </label>
                      <input
                        className="input"
                        required
                        placeholder="Arjun Mehta"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                        Email *
                      </label>
                      <input
                        className="input"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={e => set('email', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                      Phone (optional)
                    </label>
                    <input
                      className="input"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                        Experience *
                      </label>
                      <select
                        className="input"
                        required
                        value={form.experience}
                        onChange={e => set('experience', e.target.value)}
                      >
                        <option value="">Select…</option>
                        {['Fresher', '1-3 yrs', '3-5 yrs', '5+ yrs'].map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                        Target Role *
                      </label>
                      <select
                        className="input"
                        required
                        value={form.role}
                        onChange={e => set('role', e.target.value)}
                      >
                        <option value="">Select…</option>
                        {['Frontend', 'Backend', 'Full-Stack', 'DevOps', 'Mobile'].map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                        Preferred Date *
                      </label>
                      <input
                        className="input"
                        type="date"
                        required
                        value={form.preferred_date}
                        onChange={e => set('preferred_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                        Preferred Time *
                      </label>
                      <input
                        className="input"
                        type="time"
                        required
                        value={form.preferred_time}
                        onChange={e => set('preferred_time', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                      Notes (optional)
                    </label>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="Anything specific you want to focus on — DSA, System Design, HR, etc."
                      value={form.notes}
                      onChange={e => set('notes', e.target.value)}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {error && (
                    <p style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '10px 14px', borderRadius: 8 }}>
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="btn btn-blue"
                    disabled={submitting}
                    style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                  >
                    {submitting ? 'Booking…' : 'Book My Session'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
