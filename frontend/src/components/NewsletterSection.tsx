'use client';
import { useState } from 'react';
import { Mail, Check, Bell } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    await fetch(`${BASE}/subscribers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type: 'newsletter' }),
    });
    setSubmitting(false);
    setDone(true);
  }

  return (
    <section style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)', padding: '80px 0' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Bell size={24} style={{ color: '#fff' }} />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          Stay ahead in your tech career
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 32, lineHeight: 1.6 }}>
          Get weekly job alerts, interview tips, salary insights, and career resources — straight to your inbox. 60,000+ developers trust us.
        </p>

        {done ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.15)', padding: '14px 24px', borderRadius: 50, color: '#fff', fontSize: 15, fontWeight: 600 }}>
            <Check size={18} /> You're subscribed! Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%', padding: '12px 14px 12px 40px',
                  border: 'none', borderRadius: 50, fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 24px', background: '#f59e0b', color: '#fff',
                border: 'none', borderRadius: 50, fontWeight: 700, fontSize: 14,
                cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
              }}
            >
              {submitting ? 'Subscribing…' : 'Subscribe Free'}
            </button>
          </form>
        )}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>
          No spam, ever. Unsubscribe in one click.
        </p>
      </div>
    </section>
  );
}
