'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Star } from 'lucide-react';
import { api } from '@/lib/api';

const EMPTY = {
  name: '', description: '', price: '', included_features: '',
};

function arrToText(val: any): string {
  if (!val) return '';
  if (Array.isArray(val)) return val.join('\n');
  try { const p = JSON.parse(val); if (Array.isArray(p)) return p.join('\n'); } catch {}
  return String(val);
}

function textToJson(text: string): string {
  const arr = text.split('\n').map(s => s.trim()).filter(Boolean);
  return JSON.stringify(arr);
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#059669', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.services.list().then(setServices).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setShowForm(true);
  };

  const openEdit = (svc: any) => {
    setEditing(svc);
    setForm({
      name:              svc.name || '',
      description:       svc.description || '',
      price:             svc.price || '',
      included_features: arrToText(svc.included_features),
    });
    setError('');
    setShowForm(true);
  };

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        included_features: textToJson(form.included_features),
      };
      if (editing) {
        await api.services.update(editing.id, payload);
      } else {
        await api.services.create(payload);
      }
      setShowForm(false);
      load();
    } catch {
      setError('Failed to save service plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this service plan?')) return;
    try { await api.services.delete(id); load(); }
    catch { alert('Failed to delete service.'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Service Plans</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{services.length} plans</p>
        </div>
        <button className="btn btn-blue btn-sm" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Plan
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', overflowY: 'auto', padding: '40px 16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: 560, padding: 28, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{editing ? 'Edit Plan' : 'Add Plan'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            {error && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>{error}</div>
            )}
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Plan Name *</label>
                  <input required name="name" value={form.name} onChange={change} className="input" placeholder="ATS Pro" />
                </div>
                <div>
                  <label style={lbl}>Price *</label>
                  <input required name="price" value={form.price} onChange={change} className="input" placeholder="₹999" />
                </div>
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea name="description" value={form.description} onChange={change} rows={2} className="input" style={{ resize: 'vertical' }} placeholder="Built to beat every ATS system…" />
              </div>
              <div>
                <label style={lbl}>Included Features (one per line)</label>
                <textarea
                  name="included_features"
                  value={form.included_features}
                  onChange={change}
                  rows={8}
                  className="input"
                  style={{ resize: 'vertical' }}
                  placeholder="ATS-friendly template&#10;Keyword optimization&#10;3 revision rounds&#10;Cover letter included"
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-blue btn-sm" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editing ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cards view */}
      {loading ? <LoadingSpinner /> : services.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
          <Star size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
          <p>No service plans yet. Add your first plan.</p>
        </div>
      ) : (
        <>
          {/* Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            {services.map((svc, idx) => {
              const colors = ['#64748b', '#2563eb', '#7c3aed'];
              const color = colors[idx % colors.length];
              let features: string[] = [];
              try {
                const f = svc.included_features;
                features = Array.isArray(f) ? f : JSON.parse(f || '[]');
              } catch {}
              return (
                <div key={svc.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color, marginBottom: 2 }}>{svc.price}</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{svc.name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(svc)} style={iconBtn} title="Edit"><Pencil size={13} /></button>
                      <button onClick={() => del(svc.id)} style={{ ...iconBtn, color: '#ef4444' }} title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  {svc.description && (
                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{svc.description}</p>
                  )}
                  {features.length > 0 && (
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {features.slice(0, 5).map((f: string) => (
                        <li key={f} style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          {f}
                        </li>
                      ))}
                      {features.length > 5 && (
                        <li style={{ fontSize: 11, color: '#94a3b8' }}>+{features.length - 5} more features</li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Table view */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>All Plans</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {['Name', 'Price', 'Description', 'Features', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {services.map(svc => {
                    let featCount = 0;
                    try { const f = svc.included_features; featCount = (Array.isArray(f) ? f : JSON.parse(f || '[]')).length; } catch {}
                    return (
                      <tr key={svc.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{svc.name}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#2563eb' }}>{svc.price}</td>
                        <td style={{ padding: '14px 16px', color: '#64748b', maxWidth: 220 }}>
                          <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{svc.description || '—'}</div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{featCount} features</td>
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => openEdit(svc)} style={iconBtn} title="Edit"><Pencil size={13} /></button>
                            <button onClick={() => del(svc.id)} style={{ ...iconBtn, color: '#ef4444' }} title="Delete"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' };
const iconBtn: React.CSSProperties = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#64748b', display: 'inline-flex', alignItems: 'center' };
