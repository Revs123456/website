'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, GraduationCap } from 'lucide-react';
import { api } from '@/lib/api';

const CATEGORIES = ['Frontend', 'Backend', 'DevOps', 'Full-Stack', 'AI/ML'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const EMPTY = {
  title: '', platform: '', category: 'Frontend', duration: '', level: 'Beginner',
  instructor: '', rating: '', students: '', price: '', description: '',
  modules: '', course_link: '',
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
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.courses.list().then(setCourses).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setShowForm(true);
  };

  const openEdit = (course: any) => {
    setEditing(course);
    setForm({
      title:       course.title || '',
      platform:    course.platform || '',
      category:    course.category || 'Frontend',
      duration:    course.duration || '',
      level:       course.level || 'Beginner',
      instructor:  course.instructor || '',
      rating:      String(course.rating || ''),
      students:    String(course.students || ''),
      price:       course.price || '',
      description: course.description || '',
      modules:     arrToText(course.modules),
      course_link: course.course_link || '',
    });
    setError('');
    setShowForm(true);
  };

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        rating:  form.rating ? parseFloat(form.rating) : undefined,
        modules: textToJson(form.modules),
      };
      if (editing) {
        await api.courses.update(editing.id, payload);
      } else {
        await api.courses.create(payload);
      }
      setShowForm(false);
      load();
    } catch {
      setError('Failed to save course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    try { await api.courses.delete(id); load(); }
    catch { alert('Failed to delete course.'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Courses</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{courses.length} courses</p>
        </div>
        <button className="btn btn-blue btn-sm" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Course
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', overflowY: 'auto', padding: '40px 16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: 680, padding: 28, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{editing ? 'Edit Course' : 'Add Course'}</h2>
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
                <input required name="title" value={form.title} onChange={change} className="input" placeholder="Complete React & Next.js Bootcamp" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Platform</label>
                  <input name="platform" value={form.platform} onChange={change} className="input" placeholder="Udemy, Coursera…" />
                </div>
                <div>
                  <label style={lbl}>Instructor</label>
                  <input name="instructor" value={form.instructor} onChange={change} className="input" placeholder="John Doe" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Category</label>
                  <select name="category" value={form.category} onChange={change} className="input">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Level</label>
                  <select name="level" value={form.level} onChange={change} className="input">
                    {LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Duration</label>
                  <input name="duration" value={form.duration} onChange={change} className="input" placeholder="40 hours" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Rating</label>
                  <input name="rating" value={form.rating} onChange={change} className="input" placeholder="4.8" type="number" step="0.1" min="0" max="5" />
                </div>
                <div>
                  <label style={lbl}>Students</label>
                  <input name="students" value={form.students} onChange={change} className="input" placeholder="12,500" />
                </div>
                <div>
                  <label style={lbl}>Price</label>
                  <input name="price" value={form.price} onChange={change} className="input" placeholder="₹499" />
                </div>
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea name="description" value={form.description} onChange={change} rows={3} className="input" style={{ resize: 'vertical' }} placeholder="Course description…" />
              </div>
              <div>
                <label style={lbl}>Modules (one per line)</label>
                <textarea name="modules" value={form.modules} onChange={change} rows={5} className="input" style={{ resize: 'vertical' }} placeholder="React Fundamentals&#10;Hooks Deep Dive&#10;Next.js App Router" />
              </div>
              <div>
                <label style={lbl}>Course Link</label>
                <input name="course_link" value={form.course_link} onChange={change} className="input" placeholder="https://..." type="url" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-blue btn-sm" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editing ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <LoadingSpinner /> : courses.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <GraduationCap size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p>No courses yet. Add your first course.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Title', 'Platform', 'Category', 'Level', 'Rating', 'Price', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a', maxWidth: 240 }}>
                      <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.title}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{course.platform}</td>
                    <td style={{ padding: '14px 16px' }}><span className="badge badge-blue">{course.category}</span></td>
                    <td style={{ padding: '14px 16px' }}><span className="badge badge-amber">{course.level}</span></td>
                    <td style={{ padding: '14px 16px', color: '#f59e0b', fontWeight: 700 }}>{course.rating}</td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 600 }}>{course.price}</td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(course)} style={iconBtn} title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => del(course.id)} style={{ ...iconBtn, color: '#ef4444' }} title="Delete"><Trash2 size={13} /></button>
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
