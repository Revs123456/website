'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import DeleteModal from '@/components/DeleteModal';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
function getToken() { try { return typeof window !== 'undefined' ? localStorage.getItem('tch_token') : null; } catch { return null; } }
function authHeaders() { const t = getToken(); return { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }; }

const EMPTY = {
  name: '', description: '', price: 'Free', download_link: '',
  preview_image: '', tag: '', is_free: true, published: true,
};

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

export default function AdminTemplatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/resume-templates`);
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
      description: item.description || '',
      price: item.price || 'Free',
      download_link: item.download_link || '',
      preview_image: item.preview_image || '',
      tag: item.tag || '',
      is_free: item.is_free !== false,
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
        await fetch(`${BASE}/templates/${editing.id}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify(form),
        });
      } else {
        await fetch(`${BASE}/resume-templates`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(form),
        });
      }
      setShowForm(false);
      load();
    } catch {
      setError('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await fetch(`${BASE}/templates/${deleteTarget.id}`, { method: 'DELETE' }); setDeleteTarget(null); load(); }
    catch { setDeleteTarget(null); }
    finally { setDeleting(false); }
  };

  const togglePublished = async (item: any) => {
    try {
      await fetch(`${BASE}/templates/${item.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ published: !item.published }),
      });
      load();
    } catch {
      alert('Failed to update template.');
    }
  };

  return (
    <div>
      {deleteTarget && (
        <DeleteModal
          title="Delete Template?"
          name={deleteTarget.name || deleteTarget.title || ''}
          deleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Resume Templates</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{items.length} templates</p>
        </div>
        <button className="btn btn-blue btn-sm" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Template
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', overflowY: 'auto', padding: '40px 16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: 660, padding: 28, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{editing ? 'Edit Template' : 'Add Template'}</h2>
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
                  <input required name="name" value={form.name} onChange={change} className="input" placeholder="Modern Minimalist" />
                </div>
                <div>
                  <label style={lbl}>Tag</label>
                  <input name="tag" value={form.tag} onChange={change} className="input" placeholder="Popular, New, Premium…" />
                </div>
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea name="description" value={form.description} onChange={change} rows={3} className="input" style={{ resize: 'vertical' }} placeholder="Template description…" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Price</label>
                  <input name="price" value={form.price} onChange={change} className="input" placeholder="Free" />
                </div>
                <div>
                  <label style={lbl}>Download Link</label>
                  <input name="download_link" value={form.download_link} onChange={change} className="input" placeholder="https://..." type="url" />
                </div>
              </div>
              <div>
                <label style={lbl}>Preview Image URL</label>
                <input name="preview_image" value={form.preview_image} onChange={change} className="input" placeholder="https://..." type="url" />
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="is_free" name="is_free" checked={form.is_free} onChange={change} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  <label htmlFor="is_free" style={{ fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>Free Template</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="published" name="published" checked={form.published} onChange={change} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  <label htmlFor="published" style={{ fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>Published</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-blue btn-sm" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editing ? 'Update Template' : 'Add Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <LoadingSpinner /> : items.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p>No templates yet. Add your first resume template.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Name', 'Price', 'Tag', 'Downloads', 'Published', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{item.name}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {item.is_free !== false || item.price === 'Free'
                        ? <span className="badge badge-green">Free</span>
                        : <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.price}</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {item.tag ? <span className="badge badge-slate">{item.tag}</span> : <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      {item.downloads != null ? item.downloads.toLocaleString() : '0'}
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
                        <button onClick={() => setDeleteTarget(item)} style={{ ...iconBtn, color: '#ef4444' }} title="Delete"><Trash2 size={13} /></button>
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
