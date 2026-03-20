import { TrendingUp, MapPin, Briefcase, Building2 } from 'lucide-react';
import BackButton from '@/components/BackButton';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

const EXP_COLOR: Record<string, { c: string; bg: string }> = {
  Fresher:    { c: '#059669', bg: '#ecfdf5' },
  '0-1 yrs':  { c: '#059669', bg: '#ecfdf5' },
  '1-3 yrs':  { c: '#2563eb', bg: '#eff6ff' },
  '3-5 yrs':  { c: '#7c3aed', bg: '#f5f3ff' },
  '5-8 yrs':  { c: '#d97706', bg: '#fffbeb' },
  '8+ yrs':   { c: '#dc2626', bg: '#fef2f2' },
};

function fmt(n: number | string | null | undefined): string {
  if (!n) return '—';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return String(n);
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000)   return `₹${(num / 1000).toFixed(0)}K`;
  return `₹${num}`;
}

async function getSalaryInsights(): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}/salary-insights`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function SalaryInsightsPage() {
  const insights = await getSalaryInsights();

  // Group by role
  const byRole: Record<string, any[]> = {};
  for (const item of insights) {
    const role = item.role || 'Other';
    if (!byRole[role]) byRole[role] = [];
    byRole[role].push(item);
  }

  const roles = Object.keys(byRole);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingTop: 80, paddingBottom: 40 }}>
        <div style={wrap}>
          <BackButton />
          <span className="badge badge-green" style={{ marginBottom: 12, display: 'inline-flex' }}>
            {insights.length} Data Points
          </span>
          <h1 className="text-display-sm">
            Salary <span className="grad-blue">Insights</span>
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>
            Know your worth before you negotiate
          </p>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 40, paddingBottom: 80 }}>
        {insights.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <TrendingUp size={36} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
            <p>No salary data available yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {roles.map(role => (
              <div key={role}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <Briefcase size={18} style={{ color: '#2563eb' }} />
                  <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 18 }}>{role}</h2>
                  <span className="badge badge-slate">{byRole[role].length} entries</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {byRole[role].map((item, i) => {
                    const exp = EXP_COLOR[item.experience_level] || { c: '#64748b', bg: '#f8fafc' };
                    const companies = item.companies
                      ? item.companies.split(',').map((c: string) => c.trim()).filter(Boolean)
                      : [];

                    return (
                      <div key={item.id ?? i} className="card" style={{ padding: 20 }}>
                        {/* Top row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                          <div>
                            {item.city && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                                <MapPin size={11} />
                                {item.city}
                              </div>
                            )}
                            {item.experience_level && (
                              <span style={{
                                padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                                color: exp.c, background: exp.bg,
                              }}>
                                {item.experience_level}
                              </span>
                            )}
                          </div>
                          <TrendingUp size={16} style={{ color: '#2563eb', marginTop: 2 }} />
                        </div>

                        {/* Salary range */}
                        <div style={{ marginBottom: 14 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', marginBottom: 4 }}>
                            Salary Range
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                              {fmt(item.min_salary)}
                            </span>
                            <span style={{ fontSize: 13, color: '#94a3b8' }}>—</span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                              {fmt(item.max_salary)}
                            </span>
                          </div>
                        </div>

                        {item.avg_salary && (
                          <div style={{
                            padding: '8px 12px', borderRadius: 8,
                            background: '#eff6ff', marginBottom: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          }}>
                            <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>Avg Salary</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#2563eb' }}>
                              {fmt(item.avg_salary)}
                            </span>
                          </div>
                        )}

                        {companies.length > 0 && (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                              <Building2 size={11} /> Companies
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {companies.map((c: string) => (
                                <span key={c} style={{
                                  padding: '2px 8px', borderRadius: 6, fontSize: 11,
                                  background: '#f1f5f9', color: '#475569',
                                }}>
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
