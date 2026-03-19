'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, DollarSign } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

const EXPERIENCE_LEVELS = ['Fresher', '1-3 yrs', '3-5 yrs', '5+ yrs'];

const EMPTY = {
  role: '', city: '', experience_level: 'Fresher',
  min_salary: '', max_salary: '', avg_salary: '', companies: '',
};

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

export default function AdminSalaryInsightsPage() {
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
      const res = await fetch(`${BASE}/salary-insights`);
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
      role: item.role || '',
      city: item.city || '',
      experience_level: item.experience_level || 'Fresher',
      min_salary: item.min_salary ?? '',
      max_salary: item.max_salary ?? '',
      avg_salary: item.avg_salary ?? '',
      companies: Array.isArray(item.companies) ? item.companies.join(', ') : (item.companies || ''),
    });
    setError('');
    setShowForm(true);
  };

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        min_salary: form.min_salary !== '' ? Number(form.min_salary) : undefined,
        max_salary: form.max_salary !== '' ? Number(form.max_salary) : undefined,
        avg_salary: form.avg_salary !== '' ? Number(form.avg_salary) : undefined,
        companies: form.companies ? form.companies.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      };
      if (editing) {
        await fetch(`${BASE}/salary-insights/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${BASE}/salary-insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      load();
    } catch {
      setError('Failed to save salary insight. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this salary insight?')) return;
    try {
      await fetch(`${BASE}/salary-insights/${id}`, { method: 'DELETE' });
      load();
    } catch {
      alert('Failed to delete salary insight.');
    }
  };

  const fmt = (v: any) => v != null && v !== '' ? `₹${Number(v).toLocaleString('en-IN')}` : '—';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Salary Insights</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{items.length} entries</p>
        </div>
        <button className="btn btn-blue btn-sm" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Insight
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', overflowY: 'auto', padding: '40px 16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: 620, padding: 28, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{editing ? 'Edit Salary Insight' : 'Add Salary Insight'}</h2>
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
                  <label style={lbl}>Role *</label>
                  <input required name="role" value={form.role} onChange={change} className="input" placeholder="Frontend Developer" />
                </div>
                <div>
                  <label style={lbl}>City *</label>
                  <input required name="city" value={form.city} onChange={change} className="input" placeholder="Bengaluru" />
                </div>
              </div>
              <div>
                <label style={lbl}>Experience Level</label>
                <select name="experience_level" value={form.experience_level} onChange={change} className="input">
                  {EXPERIENCE_LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Min Salary (₹)</label>
                  <input type="number" name="min_salary" value={form.min_salary} onChange={change} className="input" placeholder="500000" />
                </div>
                <div>
                  <label style={lbl}>Max Salary (₹)</label>
                  <input type="number" name="max_salary" value={form.max_salary} onChange={change} className="input" placeholder="1200000" />
                </div>
                <div>
                  <label style={lbl}>Avg Salary (₹, optional)</label>
                  <input type="number" name="avg_salary" value={form.avg_salary} onChange={change} className="input" placeholder="850000" />
                </div>
              </div>
              <div>
                <label style={lbl}>Companies (optional, comma-separated)</label>
                <input name="companies" value={form.companies} onChange={change} className="input" placeholder="Google, Amazon, Flipkart" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-blue btn-sm" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editing ? 'Update Insight' : 'Add Insight'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <LoadingSpinner /> : items.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <DollarSign size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p>No salary insights yet. Add your first entry.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Role', 'City', 'Experience', 'Min Salary', 'Max Salary', 'Avg Salary', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{item.role}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{item.city}</td>
                    <td style={{ padding: '14px 16px' }}><span className="badge badge-slate">{item.experience_level}</span></td>
                    <td style={{ padding: '14px 16px', color: '#22c55e', fontWeight: 600 }}>{fmt(item.min_salary)}</td>
                    <td style={{ padding: '14px 16px', color: '#ef4444', fontWeight: 600 }}>{fmt(item.max_salary)}</td>
                    <td style={{ padding: '14px 16px', color: '#2563eb', fontWeight: 600 }}>{fmt(item.avg_salary)}</td>
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
