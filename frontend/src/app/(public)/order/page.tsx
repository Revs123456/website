'use client';
import { Suspense, useState, useEffect } from 'react';
import BackButton from '@/components/BackButton';
import { useSearchParams } from 'next/navigation';
import { Check, User, Mail, Briefcase, MessageSquare, Zap, Shield, Star, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/v1`;

declare global {
  interface Window { Razorpay: any; }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function validateGmail(value: string): string {
  if (!value) return '';
  if (!value.endsWith('@gmail.com')) return 'Must be a Gmail address (@gmail.com)';
  const local = value.slice(0, -'@gmail.com'.length);
  if (local.length < 6) return 'Gmail username must be at least 6 characters';
  if (local.length > 30) return 'Gmail username must be at most 30 characters';
  if (!/^[a-z0-9]([a-z0-9.]*[a-z0-9])?$/.test(local)) return 'Only letters, numbers, and dots allowed (no leading/trailing dots)';
  if (/\.\./.test(local)) return 'Consecutive dots are not allowed';
  return '';
}

function Form() {
  const params = useSearchParams();
  const preselectedId = params.get('service') || '';

  const [services, setServices] = useState<any[]>([]);
  const [data, setData] = useState({ name: '', email: '', service_id: preselectedId, level: 'Fresher', message: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [servicesError, setServicesError] = useState(false);

  // OTP state
  const [emailError, setEmailError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    api.services.listPublished().then(list => {
      if (!list || list.length === 0) { setServicesError(true); return; }
      setServices(list);
      if (preselectedId) {
        const match = list.find((sv: any) => String(sv.id) === preselectedId || sv.name?.toLowerCase().replace(/\s+/g, '-') === preselectedId);
        if (match) setData(d => ({ ...d, service_id: String(match.id) }));
      } else {
        setData(d => ({ ...d, service_id: String(list[0].id) }));
      }
    }).catch(() => setServicesError(true));
  }, []);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const changeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setData(d => ({ ...d, email: val }));
    setEmailError(validateGmail(val));
    // Reset OTP state if email changes after sending
    if (otpSent || otpVerified) {
      setOtpSent(false);
      setOtpVerified(false);
      setOtpValue('');
      setOtpError('');
    }
  };

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setData(d => ({ ...d, [e.target.name]: e.target.value }));
  };

  const sendOtp = async () => {
    const err = validateGmail(data.email);
    if (err) { setEmailError(err); return; }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch(`${BASE}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to send OTP');
      }
      setOtpSent(true);
      setResendCooldown(60);
    } catch (e: any) {
      setOtpError(e.message || 'Failed to send OTP. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otpValue.length !== 6) { setOtpError('Enter the 6-digit code'); return; }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch(`${BASE}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, code: otpValue }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'Invalid code');
      setOtpVerified(true);
    } catch (e: any) {
      setOtpError(e.message || 'Verification failed. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) { setOtpError('Please verify your email first.'); return; }
    setLoading(true);
    setError('');
    try {
      const selectedSvc = services.find((s: any) => String(s.id) === data.service_id);
      if (!selectedSvc) throw new Error('Selected service is no longer available. Please refresh and try again.');

      const order = await api.orders.create({
        customer_name: data.name,
        customer_email: data.email,
        name: data.name,
        email: data.email,
        service_id: data.service_id,
        service_type: selectedSvc.name,
        experience_level: data.level,
        message: data.message,
      });

      const rawPrice = selectedSvc?.price || '0';
      const amount = parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;

      const res = await fetch(`${BASE}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, amount }),
      });
      const rzpData = await res.json();
      if (!res.ok) throw new Error(rzpData.message || 'Payment initiation failed');

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load payment gateway');

      const rzp = new window.Razorpay({
        key: rzpData.key_id,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'TechChampsByRev',
        description: selectedSvc?.name || 'Service',
        order_id: rzpData.razorpay_order_id,
        prefill: { name: data.name, email: data.email },
        theme: { color: '#2563eb' },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`${BASE}/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!verifyRes.ok) {
              const body = await verifyRes.json().catch(() => ({}));
              throw new Error(body.message || 'Payment verification failed');
            }
            setDone(true);
          } catch (verifyErr: any) {
            setError(verifyErr.message || 'Payment received but verification failed. Please contact support.');
          }
          setLoading(false);
        },
        modal: { ondismiss: () => setLoading(false) },
      });

      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.');
      setLoading(false);
    }
  };

  const selectedService = services.find(s => String(s.id) === data.service_id);

  if (servicesError) return (
    <div className="card" style={{ padding: 48, textAlign: 'center' }}>
      <p style={{ fontSize: 15, color: '#dc2626', marginBottom: 16 }}>Unable to load services. Please try again later.</p>
      <Link href="/services/paid" className="btn btn-outline">View Services</Link>
    </div>
  );

  if (done) return (
    <div className="card" style={{ padding: 48, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <Check size={28} style={{ color: '#16a34a' }} />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Payment successful!</h2>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>
        Thanks <strong style={{ color: '#0f172a' }}>{data.name}</strong>! Your order is confirmed.
      </p>
      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 32 }}>Our team will reach out to your email within a few hours.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        <Link href="/" className="btn btn-primary">Back to Home</Link>
        <Link href="/jobs" className="btn btn-outline">Browse Jobs</Link>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)', gap: 20 }}>
      {/* Form */}
      <form onSubmit={submit} className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h2 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Your details</h2>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Email + OTP section */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 8 }}>
            <Mail size={11} /> Email
          </label>

          {/* Email input row */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                required
                type="email"
                name="email"
                value={data.email}
                onChange={changeEmail}
                className="input"
                placeholder="you@gmail.com"
                disabled={otpVerified}
                style={{
                  borderColor: emailError ? '#ef4444' : otpVerified ? '#16a34a' : undefined,
                  background: otpVerified ? '#f0fdf4' : undefined,
                }}
              />
              {otpVerified && (
                <Check size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#16a34a', pointerEvents: 'none' }} />
              )}
            </div>
            {!otpVerified && (
              <button
                type="button"
                onClick={sendOtp}
                disabled={otpLoading || !!emailError || !data.email || resendCooldown > 0}
                style={{
                  padding: '0 16px', borderRadius: 10, border: '1.5px solid #2563eb', background: '#eff6ff',
                  color: '#2563eb', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                  opacity: (otpLoading || !!emailError || !data.email || resendCooldown > 0) ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                {otpLoading && !otpSent ? 'Sending…' : resendCooldown > 0 ? `Resend (${resendCooldown}s)` : otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
            )}
          </div>

          {emailError && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{emailError}</p>}

          {/* OTP input — shown after sending, before verified */}
          {otpSent && !otpVerified && (
            <div style={{ marginTop: 12, padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                A 6-digit code was sent to <strong style={{ color: '#0f172a' }}>{data.email}</strong>. Enter it below.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpValue}
                  onChange={e => { setOtpValue(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                  className="input"
                  placeholder="123456"
                  style={{ letterSpacing: 8, fontWeight: 700, fontSize: 18, textAlign: 'center', flex: 1 }}
                />
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={otpLoading || otpValue.length !== 6}
                  style={{
                    padding: '0 20px', borderRadius: 10, border: 'none', background: '#2563eb',
                    color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    opacity: (otpLoading || otpValue.length !== 6) ? 0.6 : 1, flexShrink: 0,
                  }}
                >
                  {otpLoading ? 'Verifying…' : 'Verify'}
                </button>
              </div>
              {otpError && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>{otpError}</p>}
            </div>
          )}

          {/* Verified badge */}
          {otpVerified && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
              <Check size={13} /> Email verified
            </div>
          )}
        </div>

        {/* Rest of form — locked until email is verified */}
        <div style={{ opacity: otpVerified ? 1 : 0.4, pointerEvents: otpVerified ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: 20, transition: 'opacity .2s' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 8 }}>
              <User size={11} /> Name
            </label>
            <input required={otpVerified} name="name" value={data.name} onChange={change} className="input" placeholder="Rahul Sharma" tabIndex={otpVerified ? 0 : -1} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 8 }}>
                <Briefcase size={11} /> Service
              </label>
              <div className="input" style={{ background: '#f8fafc', color: '#0f172a', fontWeight: 600 }}>
                {services.find(s => String(s.id) === data.service_id)?.name || 'Loading…'}
              </div>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 8 }}>
                <Briefcase size={11} /> Experience
              </label>
              <select name="level" value={data.level} onChange={change} className="input" tabIndex={otpVerified ? 0 : -1}>
                <option>Fresher</option>
                <option>Mid-Level (2–5 yrs)</option>
                <option>Senior (5+ yrs)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 8 }}>
              <MessageSquare size={11} /> Special requests (optional)
            </label>
            <textarea
              name="message"
              value={data.message}
              onChange={change}
              rows={3}
              className="input"
              style={{ resize: 'none' }}
              placeholder="Target roles, companies, anything specific…"
              tabIndex={otpVerified ? 0 : -1}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !otpVerified || services.length === 0}
          className="btn btn-blue"
          style={{ padding: '13px', opacity: (loading || !otpVerified) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {loading ? (
            <svg style={{ animation: 'spin .8s linear infinite', width: 20, height: 20 }} fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : !otpVerified ? (
            <><Mail size={16} /> Verify email to continue</>
          ) : (
            <><CreditCard size={16} /> Pay {selectedService?.price || 'Now'}</>
          )}
        </button>

        <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
          Secured by Razorpay · UPI, Cards, Net Banking accepted
        </p>
      </form>

      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 16 }}>
            Order Summary
          </p>
          {selectedService ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>{selectedService.name}</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedService.price}</span>
              </div>
              <div className="divider" style={{ margin: '16px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{selectedService.price}</span>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Loading plans…</p>
          )}
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: Zap,    t: '48hr delivery guarantee'     },
            { icon: Shield, t: 'Satisfaction or full refund' },
            { icon: Star,   t: '98% client satisfaction'     },
          ].map(({ icon: Icon, t }) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#64748b' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} style={{ color: '#2563eb' }} />
              </div>
              {t}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 4 }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} fill="#f59e0b" style={{ color: '#f59e0b' }} />
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8' }}>Trusted by 1,200+ developers</p>
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '80px 24px 0' }}><BackButton /></div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '96px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="badge badge-blue" style={{ marginBottom: 16, display: 'inline-flex' }}>Secure Checkout</span>
          <h1 className="text-display-sm" style={{ marginBottom: 8 }}>
            Book your <span className="grad-blue">service</span>
          </h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>Fill in your details and we'll get started right away.</p>
        </div>
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #2563eb', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
          </div>
        }>
          <Form />
        </Suspense>
      </div>
    </div>
  );
}
