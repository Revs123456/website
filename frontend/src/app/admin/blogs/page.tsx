'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import DeleteModal from '@/components/DeleteModal';

const CATEGORIES = ['Career Advice', 'Resume Tips', 'Interview Prep', 'Job Search', 'Frontend', 'Backend', 'DevOps', 'Full-Stack', 'AI/ML', 'General'];

const EMPTY = {
  title: '', category: 'Career Advice', author: '', read_time: '',
  summary: '', content: '', published: true,
};

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    api.blogs.list().then(setBlogs).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setShowForm(true);
  };

  const openEdit = (blog: any) => {
    setEditing(blog);
    setForm({
      title:     blog.title || '',
      category:  blog.category || 'Career Advice',
      author:    blog.author || '',
      read_time: blog.read_time || '',
      summary:   blog.summary || '',
      content:   blog.content || '',
      published: blog.published !== false,
    });
    setError('');
    setShowForm(true);
  };

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm(f => ({ ...f, [name]: val }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.blogs.update(editing.id, form);
      } else {
        await api.blogs.create(form);
      }
      setShowForm(false);
      load();
    } catch {
      setError('Failed to save blog. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await api.blogs.delete(deleteTarget.id); setDeleteTarget(null); load(); }
    catch { setDeleteTarget(null); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      {deleteTarget && (
        <DeleteModal
          title="Delete Article?"
          name={deleteTarget.title}
          deleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Blog Articles</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{blogs.length} articles</p>
        </div>
        <button className="btn btn-blue btn-sm" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Write Article
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', overflowY: 'auto', padding: '40px 16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: 700, padding: 28, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{editing ? 'Edit Article' : 'Write Article'}</h2>
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
                <input required name="title" value={form.title} onChange={change} className="input" placeholder="10 Tips to Land Your First Tech Job" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Category</label>
                  <select name="category" value={form.category} onChange={change} className="input">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Author</label>
                  <input name="author" value={form.author} onChange={change} className="input" placeholder="Rahul Sharma" />
                </div>
                <div>
                  <label style={lbl}>Read Time</label>
                  <input name="read_time" value={form.read_time} onChange={change} className="input" placeholder="5 min read" />
                </div>
              </div>
              <div>
                <label style={lbl}>Summary</label>
                <textarea name="summary" value={form.summary} onChange={change} rows={3} className="input" style={{ resize: 'vertical' }} placeholder="Brief description of the article…" />
              </div>
              <div>
                <label style={lbl}>Content</label>
                <textarea name="content" value={form.content} onChange={change} rows={10} className="input" style={{ resize: 'vertical' }} placeholder="Full article content…" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="published"
                  name="published"
                  checked={form.published}
                  onChange={change}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="published" style={{ fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>Published (visible to users)</label>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-blue btn-sm" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editing ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <LoadingSpinner /> : blogs.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p>No articles yet. Write your first blog post.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Title', 'Category', 'Author', 'Read Time', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blogs.map(blog => (
                  <tr key={blog.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a', maxWidth: 280 }}>
                      <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{blog.title}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}><span className="badge badge-blue">{blog.category}</span></td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{blog.author || '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{blog.read_time || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${blog.published !== false ? 'badge-green' : 'badge-slate'}`}>
                        {blog.published !== false ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(blog)} style={iconBtn} title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => setDeleteTarget(blog)} style={{ ...iconBtn, color: '#ef4444' }} title="Delete"><Trash2 size={13} /></button>
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
