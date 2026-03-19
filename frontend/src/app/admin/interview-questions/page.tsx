'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, HelpCircle, ToggleLeft, ToggleRight } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const CATEGORIES = ['DSA', 'System Design', 'HR', 'Frontend', 'Backend', 'Mobile'];

const EMPTY = {
  company: '', role: '', question: '', answer: '',
  difficulty: 'Easy', category: 'DSA', published: true,
};

const difficultyColor: Record<string, string> = {
  Easy: '#22c55e',
  Medium: '#f59e0b',
  Hard: '#ef4444',
};

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

export default function AdminInterviewQuestionsPage() {
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
      const res = await fetch(`${BASE}/interview-questions`);
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
      company: item.company || '',
      role: item.role || '',
      question: item.question || '',
      answer: item.answer || '',
      difficulty: item.difficulty || 'Easy',
      category: item.category || 'DSA',
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
        await fetch(`${BASE}/interview-questions/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch(`${BASE}/interview-questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
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

  const del = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      await fetch(`${BASE}/interview-questions/${id}`, { method: 'DELETE' });
      load();
    } catch {
      alert('Failed to delete question.');
    }
  };

  const togglePublished = async (item: any) => {
    try {
      await fetch(`${BASE}/interview-questions/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !item.published }),
      });
      load();
    } catch {
      alert('Failed to update question.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Interview Questions</h1>
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
                  <label style={lbl}>Company</label>
                  <input name="company" value={form.company} onChange={change} className="input" placeholder="Google, Amazon…" />
                </div>
                <div>
                  <label style={lbl}>Role</label>
                  <input name="role" value={form.role} onChange={change} className="input" placeholder="Software Engineer" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Difficulty</label>
                  <select name="difficulty" value={form.difficulty} onChange={change} className="input">
                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Category</label>
                  <select name="category" value={form.category} onChange={change} className="input">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Question *</label>
                <textarea required name="question" value={form.question} onChange={change} rows={4} className="input" style={{ resize: 'vertical' }} placeholder="Enter the interview question…" />
              </div>
              <div>
                <label style={lbl}>Answer</label>
                <textarea name="answer" value={form.answer} onChange={change} rows={6} className="input" style={{ resize: 'vertical' }} placeholder="Detailed answer / explanation…" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="published" name="published" checked={form.published} onChange={change} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="published" style={{ fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>Published (visible to users)</label>
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
            <HelpCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p>No questions yet. Add your first interview question.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Company', 'Role', 'Category', 'Difficulty', 'Question', 'Published', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 16px', color: '#0f172a', fontWeight: 600 }}>{item.company || '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{item.role || '—'}</td>
                    <td style={{ padding: '14px 16px' }}><span className="badge badge-slate">{item.category}</span></td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: `${difficultyColor[item.difficulty]}20`, color: difficultyColor[item.difficulty] }}>
                        {item.difficulty}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', maxWidth: 260 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.question}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => togglePublished(item)} style={{ ...iconBtn, gap: 4 }}>
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
