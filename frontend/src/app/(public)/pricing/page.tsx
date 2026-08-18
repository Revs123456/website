'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import {
  Check, Sparkles, Loader2, AlertCircle, Shield, MessageSquare, Flame, Bot, Crown, Zap,
} from 'lucide-react';
import { userApi, type Plan } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import AuthModal from '@/components/AuthModal';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

// Razorpay attaches itself to window at runtime. Minimal typing — full SDK
// types aren't published; we only call the constructor + open().
// Declaration matches existing global in /book page (same modifiers required).
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const router = useRouter();
  const { user, refresh } = useUser();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);  // plan_id being processed
  const [error, setError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [rzpReady, setRzpReady] = useState(false);

  useEffect(() => {
    (async () => {
      try { setPlans(await userApi.listPlans()); }
      catch (err: any) { setError(err.message || 'Could not load plans'); }
      finally { setLoading(false); }
    })();
  }, []);

  async function handleSubscribe(plan: Plan) {
    if (!user) { setAuthOpen(true); return; }
    if (user.is_pro) {
      router.push('/account');
      return;
    }
    if (!rzpReady || !window.Razorpay) {
      setError('Payment system loading — please try again in a moment.');
      return;
    }

    setError(''); setCheckoutBusy(plan.id);
    try {
      // Step 1: backend creates Razorpay subscription
      const ck = await userApi.startCheckout(plan.id);

      // Step 2: open Razorpay Checkout with subscription_id (not order_id)
      const rzp = new window.Razorpay({
        key: ck.razorpay_key_id,
        subscription_id: ck.razorpay_subscription_id,
        name: 'TechChampsByRev',
        description: ck.plan.name,
        prefill: {
          name: user.name || '',
          email: user.email,
        },
        theme: { color: '#2563eb' },
        // Razorpay calls handler() with payment_id, subscription_id, signature
        handler: async (response: any) => {
          try {
            await userApi.verifyCheckout({
              razorpay_payment_id:      response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature:       response.razorpay_signature,
            });
            // Re-hydrate UserContext so is_pro flips everywhere immediately
            await refresh();
            router.push('/account?welcome=pro');
          } catch (err: any) {
            setError(err.message || 'Payment verification failed. Contact support if money was deducted.');
            setCheckoutBusy(null);
          }
        },
        modal: {
          ondismiss: () => setCheckoutBusy(null),
        },
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Could not start checkout');
      setCheckoutBusy(null);
    }
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '96px 24px 60px' }}>
      {/* Lazy-load Razorpay Checkout script */}
      <Script
        src={RAZORPAY_SCRIPT}
        strategy="afterInteractive"
        onLoad={() => setRzpReady(true)}
        onReady={() => setRzpReady(true)}
      />

      <Hero />

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 24, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Loader2 size={28} className="spin" style={{ color: '#94a3b8' }} />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 18, marginBottom: 40, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            {plans.map(p => (
              <PlanCard
                key={p.id}
                plan={p}
                busy={checkoutBusy === p.id}
                disabled={checkoutBusy !== null && checkoutBusy !== p.id}
                userIsPro={user?.is_pro ?? false}
                onSubscribe={() => handleSubscribe(p)}
              />
            ))}
          </div>

          <FeatureComparison />
        </>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" />
      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}

function Hero() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 38 }}>
      <span className="badge badge-violet" style={{ marginBottom: 12 }}>
        <Crown size={11} style={{ marginRight: 3 }} /> TECHCHAMPS PRO
      </span>
      <h1 style={{ fontSize: 38, fontWeight: 800, color: '#0f172a', margin: '0 0 10px', letterSpacing: '-0.03em' }}>
        Unlimited AI for your career
      </h1>
      <p style={{ fontSize: 16, color: '#64748b', margin: 0, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
        Resume optimizer, mock interviews, answer evaluator, RevBot coach — no daily caps.
        Cancel anytime, no questions asked.
      </p>
    </div>
  );
}

function PlanCard({ plan, busy, disabled, userIsPro, onSubscribe }: {
  plan: Plan;
  busy: boolean;
  disabled: boolean;
  userIsPro: boolean;
  onSubscribe: () => void;
}) {
  const isAnnual = plan.period === 'yearly';
  const monthly = plan.price_inr / (isAnnual ? 12 : 1);
  const monthlyRupees = (monthly / 100).toFixed(0);
  const totalRupees = (plan.price_inr / 100).toLocaleString('en-IN');

  return (
    <div
      className="card"
      style={{
        padding: 26, position: 'relative', overflow: 'hidden',
        border: isAnnual ? '2px solid #7c3aed' : '1px solid #e2e8f0',
        boxShadow: isAnnual ? '0 12px 40px rgba(124, 58, 237, 0.12)' : undefined,
      }}
    >
      {isAnnual && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
          color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: 0.06,
          padding: '4px 12px', borderRadius: '0 14px 0 8px',
        }}>
          SAVE ₹989
        </div>
      )}

      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
        {plan.name}
      </h3>
      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 18px' }}>
        {plan.description}
      </p>

      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
          ₹{monthlyRupees}
        </span>
        <span style={{ fontSize: 13, color: '#64748b' }}>/ month</span>
      </div>
      {isAnnual && (
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '-12px 0 18px' }}>
          Billed annually as ₹{totalRupees}
        </p>
      )}

      <button
        onClick={onSubscribe}
        disabled={busy || disabled}
        className={isAnnual ? 'btn btn-blue' : 'btn btn-outline'}
        style={{
          width: '100%', justifyContent: 'center',
          padding: '12px 22px', fontSize: 14,
          opacity: (busy || disabled) ? 0.6 : 1,
          marginBottom: 18,
          background: isAnnual && !disabled ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : undefined,
        }}
      >
        {busy ? <Loader2 size={14} className="spin" />
          : userIsPro ? <Check size={14} />
          : <Sparkles size={14} />}
        {busy ? 'Opening checkout…'
          : userIsPro ? 'You\'re already Pro'
          : 'Subscribe'}
      </button>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {plan.features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
            <Check size={14} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeatureComparison() {
  const rows = [
    { feature: 'Resume Roast', icon: <Flame size={14} />, free: '3/day', pro: 'Unlimited' },
    { feature: 'AI Resume Optimizer', icon: <Sparkles size={14} />, free: '1/day', pro: 'Unlimited' },
    { feature: 'Answer Evaluator', icon: <Zap size={14} />, free: '5/day', pro: 'Unlimited' },
    { feature: 'Mock Interview', icon: <MessageSquare size={14} />, free: '1/month', pro: 'Unlimited' },
    { feature: 'RevBot Coach', icon: <Bot size={14} />, free: '10 msg/day', pro: 'Unlimited' },
    { feature: 'Streak Shield', icon: <Shield size={14} />, free: '—', pro: '1 per month' },
    { feature: 'PRO Profile Badge', icon: <Crown size={14} />, free: '—', pro: 'Yes' },
  ];

  return (
    <div className="card" style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 16px', textAlign: 'center' }}>
        Free vs Pro
      </h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.05 }}>Feature</th>
              <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.05 }}>Free</th>
              <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.05 }}>Pro</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.feature} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 8px', color: '#0f172a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#64748b' }}>{r.icon}</span>{r.feature}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center', color: '#64748b' }}>{r.free}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', color: '#7c3aed', fontWeight: 700 }}>{r.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
