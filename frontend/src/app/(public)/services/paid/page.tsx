import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { ArrowRight, Sparkles, Check, Lock } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

const PLAN_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#0891b2', '#dc2626', '#0a66c2', '#6366f1'];

function safeJson(s: any): string[] {
  if (Array.isArray(s)) return s;
  try { return JSON.parse(s || '[]'); } catch { return []; }
}

async function getPlans(): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}/services`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data ?? [];
  } catch { return []; }
}

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

export default async function PaidServicesPage() {
  const plans = await getPlans();

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingTop: 80, paddingBottom: 40 }}>
        <div style={{ ...wrap }}>
          <BackButton />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={24} style={{ color: '#2563eb' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#2563eb', marginBottom: 2, display: 'block' }}>Expert-crafted · One-time payment</span>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Premium Services</h1>
            </div>
          </div>
          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 560 }}>
            Professional services to fast-track your career. Human experts, not templates.
          </p>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 40, paddingBottom: 80 }}>
        {plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <Lock size={32} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
            <p style={{ fontSize: 15 }}>Paid plans coming soon. Check back shortly.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 20, alignItems: 'start' }}>
            {plans.map((plan, idx) => {
              const color    = PLAN_COLORS[idx % PLAN_COLORS.length];
              const features = safeJson(plan.included_features);
              const popular  = idx === 1;
              return (
                <div key={plan.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: popular ? `2px solid ${color}` : '1px solid #e2e8f0' }}>
                  {popular && (
                    <div style={{ textAlign: 'center', padding: '7px 0', fontSize: 11, fontWeight: 700, color, background: `${color}10`, borderBottom: `1px solid ${color}20`, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                      ✦ Most Popular
                    </div>
                  )}
                  <div style={{ padding: 28, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 30, fontWeight: 800, color, letterSpacing: '-0.03em' }}>{plan.price}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>one-time</span>
                    </div>
                    <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginBottom: 8 }}>{plan.name}</h2>
                    {plan.description && (
                      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>{plan.description}</p>
                    )}
                    {features.length > 0 && (
                      <>
                        <div className="divider" style={{ marginBottom: 20 }} />
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {features.map((f: string) => (
                            <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#475569' }}>
                              <Check size={13} style={{ color, flexShrink: 0 }} />{f}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                  <div style={{ padding: '0 28px 28px' }}>
                    <Link
                      href={`/order?service=${plan.id}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', borderRadius: 10, background: popular ? color : 'transparent', color: popular ? '#fff' : color, fontWeight: 700, fontSize: 14, textDecoration: 'none', border: `1.5px solid ${color}`, transition: 'all .2s' }}
                    >
                      Get Started <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
