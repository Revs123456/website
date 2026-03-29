'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Lightbulb, ToggleLeft, ToggleRight } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
function getToken() { try { return typeof window !== 'undefined' ? localStorage.getItem('tch_token') : null; } catch { return null; } }
function authHeaders() { const t = getToken(); return { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }; }

const CATEGORIES = ['Career', 'DSA', 'Resume', 'Interview', 'Frontend', 'Backend'];

const EMPTY = { tip: '', category: 'Career', active: true };

const categoryColor: Record<string, string> = {
  Career: '#2563eb',
  DSA: '#7c3aed',
  Resume: '#0891b2',
  Interview: '#d97706',
  Frontend: '#059669',
  Backend: '#dc2626',
};

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

export default function AdminDailyTipsPage() {
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
      const res = await fetch(`${BASE}/daily-tips`);
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
      tip: item.tip || '',
      category: item.category || 'Career',
      active: item.active !== false,
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
        await fetch(`${BASE}/daily-tips/${editing.id}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify(form),
        });
      } else {
        await fetch(`${BASE}/daily-tips`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(form),
        });
      }
      setShowForm(false);
      load();
    } catch {
      setError('Failed to save tip. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this tip?')) return;
    try {
      await fetch(`${BASE}/daily-tips/${id}`, { method: 'DELETE' });
      load();
    } catch {
      alert('Failed to delete tip.');
    }
  };

  const toggleActive = async (item: any) => {
    try {
      await fetch(`${BASE}/daily-tips/${item.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ active: !item.active }),
      });
      load();
    } catch {
      alert('Failed to update tip.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Daily Tips</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{items.length} tips</p>
        </div>
        <button className="btn btn-blue btn-sm" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Tip
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', overflowY: 'auto', padding: '40px 16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: 560, padding: 28, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{editing ? 'Edit Tip' : 'Add Tip'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            {error && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>{error}</div>
            )}
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Category</label>
                <select name="category" value={form.category} onChange={change} className="input">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Tip *</label>
                <textarea required name="tip" value={form.tip} onChange={change} rows={5} className="input" style={{ resize: 'vertical' }} placeholder="Enter the daily tip…" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="active" name="active" checked={form.active} onChange={change} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="active" style={{ fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>Active (visible to users)</label>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-blue btn-sm" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editing ? 'Update Tip' : 'Add Tip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <LoadingSpinner /> : items.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <Lightbulb size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p>No tips yet. Add your first daily tip.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Category', 'Tip', 'Active', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: `${categoryColor[item.category] ?? '#64748b'}20`,
                        color: categoryColor[item.category] ?? '#64748b',
                      }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', maxWidth: 480 }}>
                      {item.tip?.length > 80 ? item.tip.slice(0, 80) + '…' : item.tip}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => toggleActive(item)} style={iconBtn} title={item.active ? 'Deactivate' : 'Activate'}>
                        {item.active !== false
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
