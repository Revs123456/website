import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { Download, FileText, Lock } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

const TAG_COLOR: Record<string, { c: string; bg: string }> = {
  ATS:          { c: '#2563eb', bg: '#eff6ff' },
  Creative:     { c: '#7c3aed', bg: '#f5f3ff' },
  Minimal:      { c: '#64748b', bg: '#f8fafc' },
  Executive:    { c: '#d97706', bg: '#fffbeb' },
  Fresher:      { c: '#059669', bg: '#ecfdf5' },
  Tech:         { c: '#0891b2', bg: '#ecfeff' },
  Premium:      { c: '#dc2626', bg: '#fef2f2' },
};

async function getTemplates(): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}/resume-templates/published`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function isFree(price: any): boolean {
  if (!price) return true;
  const s = String(price).toLowerCase().trim();
  return s === '0' || s === 'free' || s === '0.00' || s === '₹0';
}

export default async function TemplatesPage() {
  const templates = await getTemplates();
  const freeCount = templates.filter(t => isFree(t.price)).length;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingTop: 80, paddingBottom: 40 }}>
        <div style={wrap}>
          <BackButton />
          <span className="badge badge-green" style={{ marginBottom: 12, display: 'inline-flex' }}>
            {freeCount} Free Templates
          </span>
          <h1 className="text-display-sm">
            Resume <span className="grad-blue">Templates</span>
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>
            ATS-friendly templates built for Indian tech jobs
          </p>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 40, paddingBottom: 80 }}>
        {templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <FileText size={36} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
            <p>No templates available yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {templates.map((t, i) => {
              const free = isFree(t.price);
              const tag  = TAG_COLOR[t.tag] || { c: '#64748b', bg: '#f8fafc' };

              return (
                <div key={t.id ?? i} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {/* Preview area */}
                  <div style={{
                    height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: free ? '#f0fdf4' : '#faf5ff',
                    borderBottom: '1px solid #e2e8f0',
                    position: 'relative',
                  }}>
                    <FileText
                      size={40}
                      style={{ color: free ? '#86efac' : '#c4b5fd' }}
                    />
                    {!free && (
                      <div style={{
                        position: 'absolute', top: 10, right: 10,
                        width: 28, height: 28, borderRadius: '50%',
                        background: '#fff', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                      }}>
                        <Lock size={13} style={{ color: '#7c3aed' }} />
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Tags row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      {t.tag && (
                        <span style={{
                          padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                          color: tag.c, background: tag.bg,
                        }}>
                          {t.tag}
                        </span>
                      )}
                      <span style={{
                        marginLeft: 'auto',
                        padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                        color: free ? '#059669' : '#2563eb',
                        background: free ? '#ecfdf5' : '#eff6ff',
                      }}>
                        {free ? 'Free' : String(t.price)}
                      </span>
                    </div>

                    <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 6 }}>
                      {t.name}
                    </h3>

                    {t.description && (
                      <p style={{
                        fontSize: 13, color: '#64748b', lineHeight: 1.6, flex: 1, marginBottom: 16,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {t.description}
                      </p>
                    )}

                    <div className="divider" style={{ marginBottom: 16 }} />

                    {free ? (
                      t.download_link ? (
                        <a
                          href={t.download_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-blue"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        >
                          <Download size={14} /> Download Free
                        </a>
                      ) : (
                        <button
                          className="btn btn-blue"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', cursor: 'not-allowed', opacity: 0.6 }}
                          disabled
                        >
                          <Download size={14} /> Download Free
                        </button>
                      )
                    ) : (
                      <Link
                        href="/services"
                        className="btn btn-outline"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <Lock size={13} /> Get Access — {t.price}
                      </Link>
                    )}
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
