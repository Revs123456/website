'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, MessageSquare, ToggleLeft, ToggleRight } from 'lucide-react';
import DeleteModal from '@/components/DeleteModal';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
function getToken() { try { return typeof window !== 'undefined' ? localStorage.getItem('tch_token') : null; } catch { return null; } }
function authHeaders() { const t = getToken(); return { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }; }

const EMPTY = {
  author_name: '', title: '', question: '', answer: '',
  answered_by: '', tags: '', solved: false, published: true,
};

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

export default function AdminCommunityPage() {
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
      const res = await fetch(`${BASE}/community`);
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
    const tags = Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '');
    setForm({
      author_name: item.author_name || '',
      title: item.title || '',
      question: item.question || '',
      answer: item.answer || '',
      answered_by: item.answered_by || '',
      tags,
      solved: item.solved === true,
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
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      };
      if (editing) {
        await fetch(`${BASE}/community/${editing.id}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${BASE}/community`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      load();
    } catch {
      setError('Failed to save question. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await fetch(`${BASE}/community/${deleteTarget.id}`, { method: 'DELETE' }); setDeleteTarget(null); load(); }
    catch { setDeleteTarget(null); }
    finally { setDeleting(false); }
  };

  const toggleField = async (item: any, field: 'solved' | 'published') => {
    try {
      await fetch(`${BASE}/community/${item.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ [field]: !item[field] }),
      });
      load();
    } catch {
      alert('Failed to update question.');
    }
  };

  return (
    <div>
      {deleteTarget && (
        <DeleteModal
          title="Delete Question?"
          name={deleteTarget.title || deleteTarget.question || ''}
          deleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Community Q&amp;A</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{items.length} questions</p>
        </div>
        <button className="btn btn-blue btn-sm" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Question
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', overflowY: 'auto', padding: '40px 16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: 700, padding: 28, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{editing ? 'Edit Question' : 'Add Question'}</h2>
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
                  <label style={lbl}>Author Name *</label>
                  <input required name="author_name" value={form.author_name} onChange={change} className="input" placeholder="Rahul Kumar" />
                </div>
                <div>
                  <label style={lbl}>Tags (comma-separated)</label>
                  <input name="tags" value={form.tags} onChange={change} className="input" placeholder="React, DSA, Career" />
                </div>
              </div>
              <div>
                <label style={lbl}>Title *</label>
                <input required name="title" value={form.title} onChange={change} className="input" placeholder="How to prepare for system design interviews?" />
              </div>
              <div>
                <label style={lbl}>Question *</label>
                <textarea required name="question" value={form.question} onChange={change} rows={4} className="input" style={{ resize: 'vertical' }} placeholder="Detailed question…" />
              </div>
              <div>
                <label style={lbl}>Answer (optional)</label>
                <textarea name="answer" value={form.answer} onChange={change} rows={5} className="input" style={{ resize: 'vertical' }} placeholder="Answer or guidance…" />
              </div>
              <div>
                <label style={lbl}>Answered By (optional)</label>
                <input name="answered_by" value={form.answered_by} onChange={change} className="input" placeholder="Admin / Expert name" />
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="solved" name="solved" checked={form.solved} onChange={change} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  <label htmlFor="solved" style={{ fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>Solved</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="published" name="published" checked={form.published} onChange={change} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  <label htmlFor="published" style={{ fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>Published</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-blue btn-sm" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editing ? 'Update Question' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <LoadingSpinner /> : items.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p>No community questions yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Author', 'Title', 'Tags', 'Solved', 'Published', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const tags = Array.isArray(item.tags) ? item.tags : [];
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{item.author_name}</td>
                      <td style={{ padding: '14px 16px', color: '#475569', maxWidth: 280 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {tags.slice(0, 3).map((t: string) => (
                            <span key={t} className="badge badge-slate">{t}</span>
                          ))}
                          {tags.length > 3 && <span style={{ fontSize: 11, color: '#94a3b8' }}>+{tags.length - 3}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button onClick={() => toggleField(item, 'solved')} style={iconBtn}>
                          {item.solved
                            ? <ToggleRight size={15} style={{ color: '#22c55e' }} />
                            : <ToggleLeft size={15} />}
                        </button>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button onClick={() => toggleField(item, 'published')} style={iconBtn}>
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
                  );
                })}
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
