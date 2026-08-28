'use client';
import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

/**
 * Global modal that intercepts HTTP 402 errors from the API client.
 * Mounted once at the layout level — no per-page wiring needed.
 *
 * The api.ts userReq/streamSseFromPost helpers dispatch a 'pro:required'
 * CustomEvent on the window when they hit 402. This component subscribes
 * and tells the user the free-tier limit for that feature was reached.
 *
 * No Pro plan exists to sell right now, so this is informational only —
 * no upgrade CTA. If/when a real Pro plan launches, this is the one place
 * to add it back.
 */
export default function ProGateModal() {
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState('this feature');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setFeature(detail.feature || 'this feature');
      setMessage(detail.message || '');
      setOpen(true);
    };
    window.addEventListener('pro:required', handler);
    return () => window.removeEventListener('pro:required', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [open]);

  if (!open) return null;

  return (
    <div
      // Scrollable backdrop pattern — see AuthModal for explanation.
      // 88px top padding clears the fixed navbar; auto margin on card centers
      // when room exists, sticks to top with scroll when card overflows viewport.
      style={{
        position: 'fixed', inset: 0, zIndex: 110,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '88px 16px 24px',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: -1 }}
        aria-hidden="true"
      />

      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{
          position: 'relative', width: '100%', maxWidth: 460, padding: 0,
          overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          margin: 'auto',
        }}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 6, borderRadius: 8, zIndex: 1 }}
        >
          <X size={18} />
        </button>

        {/* Gradient header */}
        <div style={{
          background: 'linear-gradient(135deg,#0f172a 0%,#312e81 50%,var(--brand-violet) 100%)',
          color: '#fff', padding: '28px 28px 24px', textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, margin: '0 auto 12px',
            background: 'rgba(255,255,255,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Daily limit reached for {feature}
          </h2>
          {message && (
            <p style={{ fontSize: 13, color: '#cbd5e1', margin: '6px 0 0' }}>
              {message}
            </p>
          )}
        </div>

        <div style={{ padding: 24 }}>
          <p style={{ fontSize: 13, color: '#374151', margin: '0 0 20px', lineHeight: 1.6 }}>
            You've used up today's free allowance for this feature. It resets tomorrow — come back then to keep going.
          </p>

          <button
            onClick={() => setOpen(false)}
            className="btn btn-blue"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 22px' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
