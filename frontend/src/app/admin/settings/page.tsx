'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Save, RefreshCw } from 'lucide-react';

const STAT_KEYS = [
  { key: 'stat_community',    label: 'Community (Instagram followers)', description: 'Shown as "Trusted by X developers & students" badge + stats strip', placeholder: '60K+' },
  { key: 'stat_resumes',      label: 'Resumes Optimised',               description: 'Resumes completed stat on homepage',                               placeholder: '1,200+' },
  { key: 'stat_hired',        label: 'Jobs Landed',                     description: 'Hired stat on homepage stats strip and CTA section',               placeholder: '500+' },
  { key: 'stat_satisfaction', label: 'Client Satisfaction',             description: 'Satisfaction percentage on homepage stats strip',                  placeholder: '98%' },
];

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.settings.getMap()
      .then(map => { setValues(map); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const updates = STAT_KEYS.map(({ key }) => ({ key, value: values[key] || '' }));
    await api.settings.updateMany(updates);
    await fetch('/api/revalidate', { method: 'POST' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Site Settings</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Edit the stats shown on your homepage.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-blue btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading settings…</div>
      ) : (
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Homepage Stats</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {STAT_KEYS.map(({ key, label, description, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{description}</p>
                <input
                  type="text"
                  value={values[key] || ''}
                  placeholder={placeholder}
                  onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                  style={{
                    width: '100%', maxWidth: 300, padding: '8px 12px', border: '1px solid #e2e8f0',
                    borderRadius: 8, fontSize: 14, color: '#0f172a', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              These values update instantly on the homepage once saved. You can use any format — e.g. <strong>60K+</strong>, <strong>1,200+</strong>, <strong>98%</strong>.
            </p>
          </div>
        </div>
      )}

      {saved && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, background: '#059669', color: '#fff',
          padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,.15)', zIndex: 100,
        }}>
          Settings saved successfully!
        </div>
      )}
    </>
  );
}
