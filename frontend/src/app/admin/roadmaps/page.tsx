'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Map } from 'lucide-react';
import { api } from '@/lib/api';

const EMPTY = { title: '', description: '', color: '#2563eb', icon: 'Globe', published: true };

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' };
const iconBtn: React.CSSProperties = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#64748b', display: 'inline-flex', alignItems: 'center' };

export default function AdminRoadmapsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.roadmaps.list().then(setItems).catch(() => {}).finally(() => setLoading(false));
  };

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
      title: item.title || '',
      description: item.description || '',
      color: item.color || '#2563eb',
      icon: item.icon || 'Globe',
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
        await api.roadmaps.update(editing.id, form);
      } else {
        await api.roadmaps.create(form);
      }
      setShowForm(false);
      load();
    } catch {
      setError('Failed to save roadmap. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this roadmap?')) return;
    try { await api.roadmaps.delete(id); load(); }
    catch { alert('Failed to delete roadmap.'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Roadmaps</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{items.length} learning paths</p>
        </div>
        <button className="btn btn-blue btn-sm" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Roadmap
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', overflowY: 'auto', padding: '40px 16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: 560, padding: 28, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{editing ? 'Edit Roadmap' : 'Add Roadmap'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            {error && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>{error}</div>
            )}
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Title *</label>
                <input required name="title" value={form.title} onChange={change} className="input" placeholder="e.g. Frontend Developer" />
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea name="description" value={form.description} onChange={change} rows={3} className="input" style={{ resize: 'vertical' }} placeholder="Brief description of this roadmap…" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Color</label>
                  <input type="color" name="color" value={form.color} onChange={change} style={{ width: '100%', height: 38, borderRadius: 9, border: '1px solid #e2e8f0', cursor: 'pointer', padding: 4 }} />
                </div>
                <div>
                  <label style={lbl}>Icon</label>
                  <select name="icon" value={form.icon} onChange={change} className="input">
                    {['Globe', 'Server', 'Cloud', 'Code', 'Database', 'Cpu', 'Shield', 'Smartphone'].map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="published" name="published" checked={form.published} onChange={change} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="published" style={{ fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>Published (visible to users)</label>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-blue btn-sm" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editing ? 'Update Roadmap' : 'Add Roadmap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <LoadingSpinner /> : items.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <Map size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p>No roadmaps yet. Add your first roadmap.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Title', 'Description', 'Published', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color || '#2563eb', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', maxWidth: 360 }}>
                      {(item.description || '').slice(0, 80)}{item.description?.length > 80 ? '…' : ''}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${item.published !== false ? 'badge-green' : 'badge-slate'}`}>
                        {item.published !== false ? 'Published' : 'Draft'}
                      </span>
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
