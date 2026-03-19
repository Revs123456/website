'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Eye, EyeOff, Star } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

const EMPTY = { name: '', role: '', quote: '', initials: '', color: '#2563eb', bg: '#eff6ff', package: '', published: true };

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`${BASE}/testimonials`);
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setForm(EMPTY); setEditId(null); setShowForm(true); }
  function openEdit(t: any) { setForm({ name: t.name, role: t.role, quote: t.quote, initials: t.initials || '', color: t.color || '#2563eb', bg: t.bg || '#eff6ff', package: t.package || '', published: t.published }); setEditId(t.id); setShowForm(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editId ? `${BASE}/testimonials/${editId}` : `${BASE}/testimonials`;
    const method = editId ? 'PATCH' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this testimonial?')) return;
    await fetch(`${BASE}/testimonials/${id}`, { method: 'DELETE' });
    load();
  }

  async function togglePublished(t: any) {
    await fetch(`${BASE}/testimonials/${t.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ published: !t.published }) });
    load();
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Testimonials</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Manage customer testimonials shown on the homepage.</p>
        </div>
        <button onClick={openAdd} className="btn btn-blue btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Testimonial
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ width: '100%', maxWidth: 520, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{editId ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Name', key: 'name', placeholder: 'Rahul S.' },
                { label: 'Role', key: 'role', placeholder: 'Frontend Dev @ Zomato' },
                { label: 'Initials', key: 'initials', placeholder: 'RS' },
                { label: 'Package / Plan', key: 'package', placeholder: 'ATS Resume' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
                  <input value={form[key]} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Quote</label>
                <textarea value={form.quote} onChange={e => setForm((f: any) => ({ ...f, quote: e.target.value }))} rows={3} placeholder="What did they say..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Avatar Color</label>
                  <input type="color" value={form.color} onChange={e => setForm((f: any) => ({ ...f, color: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Avatar Background</label>
                  <input type="color" value={form.bg} onChange={e => setForm((f: any) => ({ ...f, bg: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}>
                <input type="checkbox" checked={form.published} onChange={e => setForm((f: any) => ({ ...f, published: e.target.checked }))} />
                Published (visible on homepage)
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-blue" style={{ flex: 1, justifyContent: 'center' }}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No testimonials yet. Add your first one.</div>
        ) : (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['Person', 'Rating', 'Quote', 'Package', 'Published', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((t: any, i: number) => (
                <tr key={t.id} style={{ borderBottom: i < items.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.bg, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                        {t.initials || t.name?.[0]}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: '#0f172a' }}>{t.name}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8' }}>{t.role}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={13} fill={n <= (t.rating ?? 5) ? '#f59e0b' : 'none'} style={{ color: n <= (t.rating ?? 5) ? '#f59e0b' : '#e2e8f0' }} />
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{t.rating ?? 5}/5</p>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748b', maxWidth: 260 }}>
                    <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{t.quote}"</p>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {t.package ? <span className="badge badge-slate">{t.package}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <button onClick={() => togglePublished(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: t.published ? '#059669' : '#94a3b8' }}>
                      {t.published ? <><Eye size={13} /> Live</> : <><EyeOff size={13} /> Hidden</>}
                    </button>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(t)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#64748b' }}><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(t.id)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #fee2e2', background: '#fef2f2', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
