import Link from 'next/link';
import { Check, X, Star, Clock, Users, Award, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

function safeJson(s: any): string[] {
  if (Array.isArray(s)) return s;
  try { return JSON.parse(s || '[]'); } catch { return []; }
}

const FAQS = [
  { q: 'How long does delivery take?',  a: 'Basic: 3 days · ATS Pro: 2 days · Premium: 24 hours. Rush available on request.' },
  { q: "What if I'm not satisfied?",   a: "We offer free revisions within your plan's rounds. Still not happy? Full refund, no questions asked." },
  { q: 'Do you work with freshers?',    a: 'Absolutely. We specialize in crafting standout resumes for candidates with 0–1 years of experience.' },
  { q: "How do I submit my info?",      a: "After ordering you'll receive a detailed questionnaire. Our experts build your resume based on your inputs." },
];

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

const PLAN_COLORS = ['#64748b', '#2563eb', '#7c3aed'];

export default async function ServicesPage() {
  let plans: any[] = [];
  try { plans = await api.services.list(); } catch {}

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingTop: 80, paddingBottom: 40, textAlign: 'center' }}>
        <div style={{ ...wrap, maxWidth: 600 }}>
          <span className="badge badge-green" style={{ marginBottom: 12, display: 'inline-flex' }}>Career Services</span>
          <h1 className="text-display-sm">Resumes that get you <span className="grad-blue">hired</span></h1>
          <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>Expert-crafted, ATS-optimized. Trusted by 1,200+ developers.</p>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 40, paddingBottom: 80 }}>
        {/* Proof strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 56 }}>
          {[
            { icon: Award, val: '1,200+', label: 'Resumes delivered', c: '#2563eb' },
            { icon: Star,  val: '98%',    label: 'Satisfied clients',  c: '#f59e0b' },
            { icon: Clock, val: '48hrs',  label: 'Average delivery',   c: '#059669' },
            { icon: Users, val: '500+',   label: 'Jobs landed',        c: '#7c3aed' },
          ].map(({ icon: Icon, val, label, c }) => (
            <div key={label} className="card" style={{ padding: 20, textAlign: 'center' }}>
              <Icon size={18} style={{ color: c, margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 2 }}>{val}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Pricing cards from API */}
        {plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            <p>No service plans available at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 64, alignItems: 'start' }}>
            {plans.map((plan, idx) => {
              const color = PLAN_COLORS[idx % PLAN_COLORS.length];
              const features = safeJson(plan.included_features);
              const popular = idx === 1;
              return (
                <div
                  key={plan.id}
                  className="card"
                  style={{
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    border: popular ? `2px solid ${color}` : '1px solid #e2e8f0',
                  }}
                >
                  {popular && (
                    <div style={{
                      textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 700,
                      color, background: `${color}10`, borderBottom: `1px solid ${color}20`,
                      letterSpacing: '0.05em', textTransform: 'uppercase' as const,
                    }}>
                      ✦ Most Popular
                    </div>
                  )}
                  <div style={{ padding: 28, flex: 1 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color, marginBottom: 4 }}>
                      {plan.price}
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8, fontSize: 15 }}>{plan.name}</div>
                    {plan.description && (
                      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>{plan.description}</p>
                    )}
                    <div className="divider" style={{ marginBottom: 24 }} />
                    {features.length > 0 && (
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {features.map((f: string) => (
                          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#475569' }}>
                            <Check size={13} style={{ color, flexShrink: 0 }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div style={{ padding: '0 28px 28px' }}>
                    <Link
                      href={`/order?service=${plan.id}`}
                      className={`btn ${popular ? 'btn-blue' : 'btn-outline'}`}
                      style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      Get Started <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FAQ */}
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', textAlign: 'center', marginBottom: 32 }}>Common questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map(({ q, a }) => (
              <div key={q} className="card" style={{ padding: 20 }}>
                <p style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, marginBottom: 8 }}>{q}</p>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
