'use client';
import { useEffect, useState } from 'react';
import BackButton from '@/components/BackButton';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { useAdminSync } from '@/hooks/useAdminSync';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

const CAT_COLOR: Record<string, { c: string; bg: string; border: string }> = {
  Career:    { c: '#2563eb', bg: '#eff6ff',  border: '#bfdbfe' },
  DSA:       { c: '#7c3aed', bg: '#f5f3ff',  border: '#ddd6fe' },
  Resume:    { c: '#0891b2', bg: '#ecfeff',  border: '#a5f3fc' },
  Interview: { c: '#d97706', bg: '#fffbeb',  border: '#fde68a' },
  Frontend:  { c: '#059669', bg: '#ecfdf5',  border: '#bbf7d0' },
  Backend:   { c: '#dc2626', bg: '#fef2f2',  border: '#fecaca' },
};

const wrap = { maxWidth: 860, margin: '0 auto', padding: '0 24px' } as const;

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

export default function DailyTipsPage() {
  const [tips, setTips]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [cat, setCat]           = useState('All');

  const load = () => {
    setLoading(true);
    fetch(`${BASE}/daily-tips`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setTips(Array.isArray(d) ? d.filter((t: any) => t.active !== false) : []))
      .catch(() => setTips([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useAdminSync(load);

  const categories = ['All', ...Array.from(new Set(tips.map(t => t.category).filter(Boolean)))];
  const filtered   = cat === 'All' ? tips : tips.filter(t => t.category === cat);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingTop: 80, paddingBottom: 40 }}>
        <div style={wrap}>
          <BackButton />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span className="badge badge-amber" style={{ marginBottom: 12, display: 'inline-flex' }}>
                {tips.length} Tips
              </span>
              <h1 className="text-display-sm">
                Daily <span className="grad-blue">Career Tips</span>
              </h1>
              <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>
                Bite-sized advice to sharpen your skills and accelerate your job search.
              </p>
            </div>
            <button
              onClick={load}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, color: '#64748b', cursor: 'pointer' }}
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 32, paddingBottom: 80 }}>
        {/* Category filter */}
        {!loading && tips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                style={{
                  padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: cat === c ? '#0f172a' : '#f1f5f9',
                  color: cat === c ? '#fff' : '#64748b',
                  transition: 'all .15s',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <Lightbulb size={36} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
            <p>No tips found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((tip, i) => {
              const col = CAT_COLOR[tip.category] || { c: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };
              return (
                <div key={tip.id ?? i} className="card" style={{ padding: 24, display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: col.bg, border: `1px solid ${col.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Lightbulb size={20} style={{ color: col.c }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    {tip.category && (
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: col.c, background: col.bg, marginBottom: 10 }}>
                        {tip.category}
                      </span>
                    )}
                    <p style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.7, fontWeight: 500 }}>{tip.tip}</p>
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
