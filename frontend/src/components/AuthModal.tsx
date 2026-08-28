'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, ArrowRight, Loader2, CheckCircle2, Gift } from 'lucide-react';
import { userApi } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

type Step = 'email' | 'otp';
type Mode = 'login' | 'signup';

export default function AuthModal({
  open,
  onClose,
  initialMode = 'login',
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
}) {
  const { setSession } = useUser();

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  // Set when we auto-switch login↔signup after a check-email lookup, so the
  // user understands why the form under them just changed shape.
  const [switchHint, setSwitchHint] = useState('');

  useEffect(() => { setMounted(true); }, []);

  // Phase 3 — referral capture. We accept ?ref=CODE on any page that opens
  // this modal. We validate it before showing the chip so a typo'd code
  // doesn't display a misleading "referred by" tag.
  const [refCode, setRefCode] = useState<string | null>(null);
  const [refOwner, setRefOwner] = useState<string | null>(null);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    // Read directly from window.location — avoids the useSearchParams SSG
    // bailout that would prevent every page hosting this modal from being
    // statically generated.
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('ref');
    if (!raw) { setRefCode(null); setRefOwner(null); return; }
    const code = raw.trim().toUpperCase().slice(0, 12);
    if (!/^[A-Z0-9]+$/.test(code) || code.length < 4) return;
    (async () => {
      try {
        const res = await userApi.lookupReferralCode(code);
        if (res.valid) {
          setRefCode(code);
          setRefOwner(res.referrer?.name || res.referrer?.username || 'a friend');
          // Lock into signup mode when a valid referral is present
          setMode('signup');
        }
      } catch { /* silently ignore */ }
    })();
  }, [open]);

  // Reset everything when the modal closes — leftover OTP code in state
  // would leak between sessions otherwise.
  useEffect(() => {
    if (!open) {
      setStep('email'); setEmail(''); setName(''); setCode('');
      setError(''); setBusy(false); setMode(initialMode); setSwitchHint('');
    }
  }, [open, initialMode]);

  // Resend timer — 30s after sending OTP, mirrors the backend rate limit
  // (3/min) so the UI never offers a button that would be rejected.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [open, onClose]);

  // Focus first input on step change
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      if (step === 'email') emailRef.current?.focus();
      else codeRef.current?.focus();
    }, 50);
  }, [open, step]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSwitchHint('');
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      // Route before sending an OTP: a "Sign in" attempt with no matching
      // account goes to the signup step (name field) instead of straight to
      // OTP; a "Create an account" attempt with a matching account goes to
      // sign-in instead of creating a duplicate. Either way we stop short of
      // sending an OTP until the mode actually matches the account state.
      const { exists } = await userApi.checkEmail(trimmed);
      if (mode === 'login' && !exists) {
        setMode('signup');
        setSwitchHint("We couldn't find an account with that email — let's create one.");
        return;
      }
      if (mode === 'signup' && exists) {
        setMode('login');
        setSwitchHint('An account already exists for that email — sign in instead.');
        return;
      }
      await userApi.startAuth(trimmed);
      setStep('otp');
      setResendIn(30);
    } catch (err: any) {
      setError(err.message || 'Could not send code. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setBusy(true);
    try {
      const res = await userApi.verifyOtp({
        email: email.trim().toLowerCase(),
        code,
        ...(mode === 'signup' && name.trim() ? { name: name.trim() } : {}),
        ...(mode === 'signup' && refCode ? { ref_code: refCode } : {}),
      });
      setSession(res.user, res.csrfToken);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (resendIn > 0 || busy) return;
    setError('');
    setBusy(true);
    try {
      await userApi.startAuth(email.trim().toLowerCase());
      setResendIn(30);
      setCode('');
    } catch (err: any) {
      setError(err.message || 'Could not resend code.');
    } finally {
      setBusy(false);
    }
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '80px 16px 24px',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
      }}
      onClick={onClose}
    >
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}
        aria-hidden="true"
      />

      <div
        className="card"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: 420, padding: 28,
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
          // Auto margins give vertical centering when there's room, no-op when scrolling
          margin: 'auto',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 6, borderRadius: 8 }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#2563eb,var(--brand-violet))' }}>
            {step === 'otp' ? <CheckCircle2 size={22} color="#fff" /> : <Mail size={22} color="#fff" />}
          </div>
          <h2 id="auth-modal-title" style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {step === 'email'
              ? (mode === 'signup' ? 'Create your account' : 'Welcome back')
              : 'Enter verification code'}
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {step === 'email'
              ? 'We’ll email you a 6-digit code — no password needed.'
              : <>Sent to <strong style={{ color: '#0f172a' }}>{email}</strong></>}
          </p>

          {/* Referral chip — shown when a valid ?ref= code was captured */}
          {refOwner && step === 'email' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 12, padding: '6px 12px', borderRadius: 99,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              color: '#15803d', fontSize: 12, fontWeight: 600,
            }}>
              <Gift size={12} /> Invited by {refOwner} · You both get +200 XP
            </div>
          )}
        </div>

        {/* Step: email */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Your name
                </label>
                <input
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Sharma"
                  autoComplete="name"
                  maxLength={80}
                />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Email address
              </label>
              <input
                ref={emailRef}
                className="input"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setSwitchHint(''); }}
                placeholder="you@example.com"
                autoComplete="email"
                required
                maxLength={200}
              />
            </div>

            {switchHint && <div style={errorBox}>{switchHint}</div>}
            {error && <div style={errorBox}>{error}</div>}

            <button type="submit" disabled={busy} className="btn btn-blue" style={{ width: '100%', marginTop: 4, opacity: busy ? 0.7 : 1 }}>
              {busy ? <Loader2 size={15} className="spin" /> : <ArrowRight size={15} />}
              {busy ? 'Sending…' : 'Send code'}
            </button>

            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: '6px 0 0' }}>
              {mode === 'signup' ? 'Already have an account? ' : 'New here? '}
              <button
                type="button"
                onClick={() => { setMode(m => m === 'signup' ? 'login' : 'signup'); setError(''); setSwitchHint(''); }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                {mode === 'signup' ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </form>
        )}

        {/* Step: otp */}
        {step === 'otp' && (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              ref={codeRef}
              className="input"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              autoComplete="one-time-code"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              style={{ textAlign: 'center', letterSpacing: 8, fontSize: 22, fontWeight: 700, fontFamily: 'monospace' }}
            />

            {error && <div style={errorBox}>{error}</div>}

            <button type="submit" disabled={busy || code.length !== 6} className="btn btn-blue" style={{ width: '100%', opacity: (busy || code.length !== 6) ? 0.7 : 1 }}>
              {busy ? <Loader2 size={15} className="spin" /> : <ArrowRight size={15} />}
              {busy ? 'Verifying…' : 'Verify & continue'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#94a3b8' }}>
              <button
                type="button"
                onClick={() => { setStep('email'); setCode(''); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
              >
                ← Use a different email
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendIn > 0 || busy}
                style={{ background: 'none', border: 'none', color: resendIn > 0 ? '#cbd5e1' : '#2563eb', cursor: resendIn > 0 ? 'default' : 'pointer', padding: 0, fontWeight: 600 }}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        <p style={{ fontSize: 11, color: '#cbd5e1', textAlign: 'center', margin: '20px 0 0' }}>
          By continuing you agree to our terms and privacy policy.
        </p>
      </div>

      <style>{`
        @keyframes _spin { to { transform: rotate(360deg); } }
        .spin { animation: _spin 1s linear infinite; }
      `}</style>
    </div>,
    document.body
  );
}

const errorBox: React.CSSProperties = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 12,
  color: '#dc2626',
};
