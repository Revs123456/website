'use client';
import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Star, Eye, EyeOff, Calendar, Upload, ListPlus, ChevronUp, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import DeleteModal from '@/components/DeleteModal';

function safeParseFeatures(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
}

type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number';
type CustomField = { key: string; label: string; type: FieldType; required: boolean; options?: string[]; placeholder?: string };

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: 'Text', textarea: 'Long text', select: 'Dropdown', checkbox: 'Checkbox', date: 'Date', number: 'Number',
};

// Stable, unique key from a label — "Project Description" -> "project_description".
// Adding a numeric suffix on collision keeps every field's key unique within a service.
function slugifyKey(label: string, existing: string[]): string {
  const base = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'field';
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

const EMPTY = {
  name: '', description: '', price: '', included_features: '', is_popular: false, published: true,
  requires_slot: false, requires_file_upload: false, file_upload_label: '',
  custom_fields: [] as CustomField[],
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

import AdminSkeleton from '@/components/AdminSkeleton';
function LoadingSpinner() { return <AdminSkeleton />; }

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Parse included_features once per service, not on every render
  const parsedServices = useMemo(() =>
    services.map(svc => ({
      ...svc,
      _features: safeParseFeatures(svc.included_features),
    })),
  [services]);

  const load = () => {
    setLoading(true);
    api.services.list().then(setServices).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setShowForm(true);
  };

  const openEdit = (svc: any) => {
    setEditing(svc);
    setForm({
      name:              svc.name || '',
      description:       svc.description || '',
      price:             svc.price || '',
      included_features: arrToText(svc.included_features),
      is_popular:        !!svc.is_popular,
      published:         svc.published !== false,
      requires_slot:        !!svc.requires_slot,
      requires_file_upload: !!svc.requires_file_upload,
      file_upload_label:    svc.file_upload_label || '',
      custom_fields:        Array.isArray(svc.custom_fields) ? svc.custom_fields : [],
    });
    setError('');
    setShowForm(true);
  };

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    setForm(f => ({ ...f, [target.name]: target.type === 'checkbox' ? target.checked : target.value }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        included_features: textToJson(form.included_features),
        is_popular: form.is_popular,
        file_upload_label: form.requires_file_upload ? form.file_upload_label : undefined,
      };
      if (editing) {
        await api.services.update(editing.id, payload);
      } else {
        await api.services.create(payload);
      }
      setShowForm(false);
      load();
    } catch {
      setError('Failed to save service plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await api.services.delete(deleteTarget.id); setDeleteTarget(null); load(); }
    catch { setDeleteTarget(null); }
    finally { setDeleting(false); }
  };

  // ── Custom field builder ──────────────────────────────────────────────
  // Key is generated once, at add-time, from the initial label — and then
  // left alone even if the label is edited later. It's the stable id an
  // order's custom_field_values are keyed by; regenerating it on every label
  // edit would silently orphan already-submitted answers for existing orders.
  const addField = () => {
    const key = slugifyKey('New field', form.custom_fields.map(f => f.key));
    setForm(f => ({ ...f, custom_fields: [...f.custom_fields, { key, label: 'New field', type: 'text', required: false }] }));
  };
  const updateField = (i: number, patch: Partial<CustomField>) => {
    setForm(f => ({ ...f, custom_fields: f.custom_fields.map((fld, idx) => idx === i ? { ...fld, ...patch } : fld) }));
  };
  const removeField = (i: number) => {
    setForm(f => ({ ...f, custom_fields: f.custom_fields.filter((_, idx) => idx !== i) }));
  };
  const moveField = (i: number, dir: -1 | 1) => {
    setForm(f => {
      const arr = [...f.custom_fields];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return f;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...f, custom_fields: arr };
    });
  };

  return (
    <div>
      {deleteTarget && (
        <DeleteModal
          title="Delete Service?"
          name={deleteTarget.name}
          deleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Service Plans</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{services.length} plans</p>
        </div>
        <button className="btn btn-blue btn-sm" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Plan
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', overflowY: 'auto', padding: '40px 16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: 640, padding: 28, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{editing ? 'Edit Plan' : 'Add Plan'}</h2>
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
                  <label style={lbl}>Plan Name *</label>
                  <input required name="name" value={form.name} onChange={change} className="input" placeholder="ATS Pro" />
                </div>
                <div>
                  <label style={lbl}>Price *</label>
                  <input required name="price" value={form.price} onChange={change} className="input" placeholder="₹999" />
                </div>
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea name="description" value={form.description} onChange={change} rows={2} className="input" style={{ resize: 'vertical' }} placeholder="Built to beat every ATS system…" />
              </div>
              <div>
                <label style={lbl}>Included Features (one per line)</label>
                <textarea
                  name="included_features"
                  value={form.included_features}
                  onChange={change}
                  rows={8}
                  className="input"
                  style={{ resize: 'vertical' }}
                  placeholder="ATS-friendly template&#10;Keyword optimization&#10;3 revision rounds&#10;Cover letter included"
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, background: form.is_popular ? '#fffbeb' : '#f8fafc', border: `1px solid ${form.is_popular ? '#fde68a' : '#e2e8f0'}` }}>
                <input
                  type="checkbox"
                  name="is_popular"
                  checked={form.is_popular}
                  onChange={change}
                  style={{ width: 16, height: 16, accentColor: '#d97706', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: form.is_popular ? '#92400e' : '#64748b' }}>
                  <Star size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle', color: form.is_popular ? '#d97706' : '#94a3b8' }} />
                  Mark as "Most Popular"
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, background: form.published ? '#f0fdf4' : '#f8fafc', border: `1px solid ${form.published ? '#bbf7d0' : '#e2e8f0'}` }}>
                <input
                  type="checkbox"
                  name="published"
                  checked={form.published}
                  onChange={change}
                  style={{ width: 16, height: 16, accentColor: '#16a34a', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: form.published ? '#15803d' : '#64748b' }}>
                  {form.published
                    ? <><Eye size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Visible to public</>
                    : <><EyeOff size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Hidden (draft)</>}
                </span>
              </label>

              {/* ── Requirements — drives the public checkout flow, no code changes needed per service ── */}
              <div className="divider" />
              <div>
                <label style={lbl}>Requirements</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, background: form.requires_slot ? '#eff6ff' : '#f8fafc', border: `1px solid ${form.requires_slot ? '#bfdbfe' : '#e2e8f0'}` }}>
                    <input type="checkbox" name="requires_slot" checked={form.requires_slot} onChange={change} style={{ width: 16, height: 16, accentColor: '#2563eb', cursor: 'pointer' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: form.requires_slot ? '#1d4ed8' : '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={13} /> Requires a scheduled slot
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, background: form.requires_file_upload ? '#f5f3ff' : '#f8fafc', border: `1px solid ${form.requires_file_upload ? '#ddd6fe' : '#e2e8f0'}` }}>
                    <input type="checkbox" name="requires_file_upload" checked={form.requires_file_upload} onChange={change} style={{ width: 16, height: 16, accentColor: 'var(--brand-violet)', cursor: 'pointer' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: form.requires_file_upload ? '#6d28d9' : '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={13} /> Requires a file upload
                    </span>
                  </label>
                  {form.requires_file_upload && (
                    <input
                      name="file_upload_label" value={form.file_upload_label} onChange={change}
                      className="input" placeholder="What should we ask the user to upload? e.g. Upload your resume"
                      style={{ marginLeft: 26, width: 'calc(100% - 26px)' }}
                    />
                  )}
                </div>
              </div>

              {/* ── Custom fields — the open-ended case: forms, extra info, anything else ── */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>Custom Fields</label>
                  <button type="button" onClick={addField} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <ListPlus size={13} /> Add Field
                  </button>
                </div>
                {form.custom_fields.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#94a3b8', padding: '8px 0' }}>No extra fields — the customer will only enter name/email/phone.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.custom_fields.map((fld, i) => (
                      <div key={fld.key} style={{ padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                            <button type="button" onClick={() => moveField(i, -1)} disabled={i === 0} style={{ ...iconBtn, padding: 2, opacity: i === 0 ? 0.3 : 1 }} title="Move up"><ChevronUp size={12} /></button>
                            <button type="button" onClick={() => moveField(i, 1)} disabled={i === form.custom_fields.length - 1} style={{ ...iconBtn, padding: 2, opacity: i === form.custom_fields.length - 1 ? 0.3 : 1 }} title="Move down"><ChevronDown size={12} /></button>
                          </div>
                          <input
                            value={fld.label} onChange={e => updateField(i, { label: e.target.value })}
                            className="input" placeholder="Field label" style={{ flex: 1 }}
                          />
                          <select value={fld.type} onChange={e => updateField(i, { type: e.target.value as FieldType })} className="input" style={{ width: 130, flexShrink: 0 }}>
                            {(Object.keys(FIELD_TYPE_LABEL) as FieldType[]).map(t => <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>)}
                          </select>
                          <button type="button" onClick={() => removeField(i)} style={{ ...iconBtn, color: '#ef4444', flexShrink: 0 }} title="Remove field"><Trash2 size={13} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingLeft: 22 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', cursor: 'pointer', flexShrink: 0 }}>
                            <input type="checkbox" checked={fld.required} onChange={e => updateField(i, { required: e.target.checked })} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                            Required
                          </label>
                          <input
                            value={fld.placeholder || ''} onChange={e => updateField(i, { placeholder: e.target.value })}
                            className="input" placeholder="Placeholder text (optional)" style={{ flex: 1, fontSize: 12, padding: '6px 10px' }}
                          />
                          {fld.type === 'select' && (
                            <input
                              value={(fld.options || []).join(', ')}
                              onChange={e => updateField(i, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                              className="input" placeholder="Options, comma-separated" style={{ flex: 1, fontSize: 12, padding: '6px 10px' }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-blue btn-sm" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editing ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cards view */}
      {loading ? <LoadingSpinner /> : services.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
          <Star size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
          <p>No service plans yet. Add your first plan.</p>
        </div>
      ) : (
        <>
          {/* Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            {parsedServices.map((svc, idx) => {
              const colors = ['#64748b', '#2563eb', 'var(--brand-violet)'];
              const color = colors[idx % colors.length];
              const features = svc._features;
              return (
                <div key={svc.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color }}>{svc.price}</div>
                        {svc.is_popular && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>★ Popular</span>}
                        {!svc.published && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>Draft</span>}
                      </div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{svc.name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(svc)} style={iconBtn} title="Edit"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteTarget(svc)} style={{ ...iconBtn, color: '#ef4444' }} title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  {svc.description && (
                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{svc.description}</p>
                  )}
                  {features.length > 0 && (
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {features.slice(0, 5).map((f: string) => (
                        <li key={f} style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          {f}
                        </li>
                      ))}
                      {features.length > 5 && (
                        <li style={{ fontSize: 11, color: '#94a3b8' }}>+{features.length - 5} more features</li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Table view */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>All Plans</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {['Name', 'Price', 'Description', 'Features', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedServices.map(svc => {
                    const featCount = svc._features.length;
                    return (
                      <tr key={svc.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{svc.name}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#2563eb' }}>{svc.price}</td>
                        <td style={{ padding: '14px 16px', color: '#64748b', maxWidth: 220 }}>
                          <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{svc.description || '—'}</div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{featCount} features</td>
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => openEdit(svc)} style={iconBtn} title="Edit"><Pencil size={13} /></button>
                            <button onClick={() => setDeleteTarget(svc)} style={{ ...iconBtn, color: '#ef4444' }} title="Delete"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' };
const iconBtn: React.CSSProperties = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#64748b', display: 'inline-flex', alignItems: 'center' };
