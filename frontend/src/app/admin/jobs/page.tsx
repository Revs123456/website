'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Briefcase } from 'lucide-react';
import { api } from '@/lib/api';

const CATEGORIES = ['Frontend', 'Backend', 'DevOps', 'Full-Stack', 'AI/ML'];
const TYPES = ['Full-time', 'Contract', 'Internship', 'Part-time'];

const EMPTY = {
  title: '', company: '', location: '', experience: '', type: 'Full-time',
  category: 'Frontend', salary: '', description: '', tech_stack: '',
  requirements: '', benefits: '', apply_link: '',
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

function commaSplitToJson(text: string): string {
  const arr = text.split(',').map(s => s.trim()).filter(Boolean);
  return JSON.stringify(arr);
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.jobs.list().then(setJobs).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setShowForm(true);
  };

  const openEdit = (job: any) => {
    setEditing(job);
    setForm({
      title:        job.title || '',
      company:      job.company || '',
      location:     job.location || '',
      experience:   job.experience || '',
      type:         job.type || 'Full-time',
      category:     job.category || 'Frontend',
      salary:       job.salary || '',
      description:  job.description || '',
      tech_stack:   arrToText(job.tech_stack).split('\n').join(', '),
      requirements: arrToText(job.requirements),
      benefits:     arrToText(job.benefits),
      apply_link:   job.apply_link || '',
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
        tech_stack:   commaSplitToJson(form.tech_stack),
        requirements: textToJson(form.requirements),
        benefits:     textToJson(form.benefits),
      };
      if (editing) {
        await api.jobs.update(editing.id, payload);
      } else {
        await api.jobs.create(payload);
      }
      setShowForm(false);
      load();
    } catch {
      setError('Failed to save job. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this job?')) return;
    try {
      await api.jobs.delete(id);
      load();
    } catch {
      alert('Failed to delete job.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Jobs</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{jobs.length} listings</p>
        </div>
        <button className="btn btn-blue btn-sm" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Job
        </button>
      </div>

      {/* Form panel */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', overflowY: 'auto', padding: '40px 16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: 680, padding: 28, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{editing ? 'Edit Job' : 'Add Job'}</h2>
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
                  <label style={lbl}>Title *</label>
                  <input required name="title" value={form.title} onChange={change} className="input" placeholder="Senior React Developer" />
                </div>
                <div>
                  <label style={lbl}>Company *</label>
                  <input required name="company" value={form.company} onChange={change} className="input" placeholder="TechCorp" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Location *</label>
                  <input required name="location" value={form.location} onChange={change} className="input" placeholder="Remote / Bengaluru" />
                </div>
                <div>
                  <label style={lbl}>Experience</label>
                  <input name="experience" value={form.experience} onChange={change} className="input" placeholder="2–4 years" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Type</label>
                  <select name="type" value={form.type} onChange={change} className="input">
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Category</label>
                  <select name="category" value={form.category} onChange={change} className="input">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Salary</label>
                  <input name="salary" value={form.salary} onChange={change} className="input" placeholder="₹15–25 LPA" />
                </div>
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea name="description" value={form.description} onChange={change} rows={4} className="input" style={{ resize: 'vertical' }} placeholder="Role description…" />
              </div>
              <div>
                <label style={lbl}>Tech Stack (comma-separated)</label>
                <input name="tech_stack" value={form.tech_stack} onChange={change} className="input" placeholder="React, TypeScript, Node.js" />
              </div>
              <div>
                <label style={lbl}>Requirements (one per line)</label>
                <textarea name="requirements" value={form.requirements} onChange={change} rows={4} className="input" style={{ resize: 'vertical' }} placeholder="3+ years React experience&#10;Strong TypeScript skills" />
              </div>
              <div>
                <label style={lbl}>Benefits (one per line)</label>
                <textarea name="benefits" value={form.benefits} onChange={change} rows={3} className="input" style={{ resize: 'vertical' }} placeholder="Remote-first&#10;Health insurance&#10;Stock options" />
              </div>
              <div>
                <label style={lbl}>Apply Link</label>
                <input name="apply_link" value={form.apply_link} onChange={change} className="input" placeholder="https://..." type="url" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-blue btn-sm" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editing ? 'Update Job' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <LoadingSpinner /> : jobs.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <Briefcase size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p>No jobs yet. Add your first job listing.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Title', 'Company', 'Location', 'Type', 'Category', 'Salary', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{job.title}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{job.company}</td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{job.location}</td>
                    <td style={{ padding: '14px 16px' }}><span className="badge badge-green">{job.type}</span></td>
                    <td style={{ padding: '14px 16px' }}><span className="badge badge-blue">{job.category}</span></td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 600 }}>{job.salary}</td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(job)} style={iconBtn} title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => del(job.id)} style={{ ...iconBtn, color: '#ef4444' }} title="Delete">
                          <Trash2 size={13} />
                        </button>
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
