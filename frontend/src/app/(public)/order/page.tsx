'use client';
import { Suspense, useState, useEffect } from 'react';
import BackButton from '@/components/BackButton';
import { useSearchParams } from 'next/navigation';
import { Check, User, Mail, Briefcase, MessageSquare, Zap, Shield, Star, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

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

function Form() {
  const params = useSearchParams();
  const [services, setServices] = useState<any[]>([]);
  const [data, setData] = useState({
    name: '',
    email: '',
    service_id: params.get('service') || '',
    level: 'Fresher',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.services.list().then(list => {
      setServices(list);
      const s = params.get('service');
      if (s) {
        const match = list.find((sv: any) => String(sv.id) === s || sv.name?.toLowerCase().replace(/\s+/g, '-') === s);
        if (match) setData(d => ({ ...d, service_id: String(match.id) }));
        else if (list.length > 0) setData(d => ({ ...d, service_id: String(list[0].id) }));
      } else if (list.length > 0) {
        setData(d => ({ ...d, service_id: String(list[0].id) }));
      }
    }).catch(() => {});
  }, []);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setData(d => ({ ...d, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const selectedSvc = services.find((s: any) => String(s.id) === data.service_id);

      // Step 1: Create order in DB
      const order = await api.orders.create({
        customer_name: data.name,
        customer_email: data.email,
        name: data.name,
        email: data.email,
        service_id: data.service_id,
        service_type: selectedSvc?.name || data.service_id,
        experience_level: data.level,
        message: data.message,
      });

      // Step 2: Parse amount from service price (e.g. "₹999" → 999)
      const rawPrice = selectedSvc?.price || '0';
      const amount = parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;

      // Step 3: Create Razorpay order
      const res = await fetch(`${BASE}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, amount }),
      });
      const rzpData = await res.json();

      if (!res.ok) throw new Error(rzpData.message || 'Payment initiation failed');

      // Step 4: Load Razorpay script & open checkout
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
          // Step 5: Verify payment on backend
          try {
            await fetch(`${BASE}/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            setDone(true);
          } catch {
            setError('Payment received but verification failed. Please contact support.');
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.');
      setLoading(false);
    }
  };

  const selectedService = services.find(s => String(s.id) === data.service_id);

  if (done) return (
    <div className="card" style={{ padding: 48, textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px', background: '#f0fdf4', border: '1px solid #bbf7d0',
      }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 8 }}>
              <User size={11} /> Name
            </label>
            <input required name="name" value={data.name} onChange={change} className="input" placeholder="Rahul Sharma" />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 8 }}>
              <Mail size={11} /> Email
            </label>
            <input required type="email" name="email" value={data.email} onChange={change} className="input" placeholder="you@email.com" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 8 }}>
              <Briefcase size={11} /> Service
            </label>
            <select name="service_id" value={data.service_id} onChange={change} className="input">
              {services.map(s => (
                <option key={s.id} value={String(s.id)}>{s.name} — {s.price}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 8 }}>
              <Briefcase size={11} /> Experience
            </label>
            <select name="level" value={data.level} onChange={change} className="input">
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
          />
        </div>

        <button
          type="submit"
          disabled={loading || services.length === 0}
          className="btn btn-blue"
          style={{ padding: '13px', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {loading ? (
            <svg style={{ animation: 'spin .8s linear infinite', width: 20, height: 20 }} fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : <><CreditCard size={16} /> Pay {selectedService?.price || 'Now'}</>}
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
