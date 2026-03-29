'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Star, ToggleLeft, ToggleRight } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
function getToken() { try { return typeof window !== 'undefined' ? localStorage.getItem('tch_token') : null; } catch { return null; } }
function authHeaders() { const t = getToken(); return { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }; }

const EMPTY = {
  name: '', before_role: '', after_role: '', company: '',
  salary_hike: '', story: '', initials: '', color: '#ffffff', bg: '#2563eb', published: true,
};

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

function Avatar({ name, initials, color, bg }: { name: string; initials?: string; color?: string; bg?: string }) {
  const text = initials || name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bg || '#2563eb', color: color || '#ffffff', fontWeight: 700, fontSize: 12, flexShrink: 0,
    }}>
      {text}
    </div>
  );
}

export default function AdminSuccessStoriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/success-stories`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      before_role: item.before_role || '',
      after_role: item.after_role || '',
      company: item.company || '',
      salary_hike: item.salary_hike || '',
      story: item.story || '',
      initials: item.initials || '',
      color: item.color || '#ffffff',
      bg: item.bg || '#2563eb',
      published: item.published !== false,
    });
    setError('');
    setShowForm(true);
  };

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm((f: any) => ({ ...f, [name]: val }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await fetch(`${BASE}/success-stories/${editing.id}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify(form),
        });
      } else {
        await fetch(`${BASE}/success-stories`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(form),
        });
      }
      setShowForm(false);
      load();
    } catch {
      setError('Failed to save story. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this success story?')) return;
    try {
      await fetch(`${BASE}/success-stories/${id}`, { method: 'DELETE' });
      load();
    } catch {
      alert('Failed to delete success story.');
    }
  };

  const togglePublished = async (item: any) => {
    try {
      await fetch(`${BASE}/success-stories/${item.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ published: !item.published }),
      });
      load();
    } catch {
      alert('Failed to update story.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Success Stories</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{items.length} stories</p>
        </div>
        <button className="btn btn-blue btn-sm" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Story
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', overflowY: 'auto', padding: '40px 16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: 700, padding: 28, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{editing ? 'Edit Story' : 'Add Story'}</h2>
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
                  <label style={lbl}>Name *</label>
                  <input required name="name" value={form.name} onChange={change} className="input" placeholder="Priya Sharma" />
                </div>
                <div>
                  <label style={lbl}>Company</label>
                  <input name="company" value={form.company} onChange={change} className="input" placeholder="Google" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Before Role *</label>
                  <input required name="before_role" value={form.before_role} onChange={change} className="input" placeholder="Junior Developer" />
                </div>
                <div>
                  <label style={lbl}>After Role *</label>
                  <input required name="after_role" value={form.after_role} onChange={change} className="input" placeholder="Senior Engineer" />
                </div>
              </div>
              <div>
                <label style={lbl}>Salary Hike (optional)</label>
                <input name="salary_hike" value={form.salary_hike} onChange={change} className="input" placeholder="120%" />
              </div>
              <div>
                <label style={lbl}>Story *</label>
                <textarea required name="story" value={form.story} onChange={change} rows={5} className="input" style={{ resize: 'vertical' }} placeholder="Tell the success journey…" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Initials (optional)</label>
                  <input name="initials" value={form.initials} onChange={change} className="input" placeholder="PS" maxLength={3} />
                </div>
                <div>
                  <label style={lbl}>Text Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="color" name="color" value={form.color} onChange={change} style={{ width: 40, height: 36, border: '1px solid #e2e8f0', borderRadius: 6, padding: 2, cursor: 'pointer' }} />
                    <input name="color" value={form.color} onChange={change} className="input" style={{ flex: 1 }} placeholder="#ffffff" />
                  </div>
                </div>
                <div>
                  <label style={lbl}>BG Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="color" name="bg" value={form.bg} onChange={change} style={{ width: 40, height: 36, border: '1px solid #e2e8f0', borderRadius: 6, padding: 2, cursor: 'pointer' }} />
                    <input name="bg" value={form.bg} onChange={change} className="input" style={{ flex: 1 }} placeholder="#2563eb" />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="published" name="published" checked={form.published} onChange={change} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="published" style={{ fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>Published (visible to users)</label>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-blue btn-sm" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editing ? 'Update Story' : 'Add Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <LoadingSpinner /> : items.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <Star size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p>No success stories yet. Add the first one.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Person', 'Journey', 'Company', 'Salary Hike', 'Published', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={item.name} initials={item.initials} color={item.color} bg={item.bg} />
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      <span style={{ color: '#94a3b8' }}>{item.before_role}</span>
                      <span style={{ margin: '0 6px', color: '#cbd5e1' }}>→</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.after_role}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{item.company || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {item.salary_hike
                        ? <span className="badge badge-green">{item.salary_hike}</span>
                        : <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => togglePublished(item)} style={iconBtn}>
                        {item.published !== false
                          ? <ToggleRight size={15} style={{ color: '#22c55e' }} />
                          : <ToggleLeft size={15} />}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(item)} style={iconBtn} title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => del(item.id)} style={{ ...iconBtn, color: '#ef4444' }} title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' };
const iconBtn: React.CSSProperties = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#64748b', display: 'inline-flex', alignItems: 'center' };
