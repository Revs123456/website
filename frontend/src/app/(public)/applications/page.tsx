'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Loader2, Plus, X, Calendar, Trash2,
  CheckCircle2, Send, MessageSquare, Trophy, XCircle, ExternalLink,
} from 'lucide-react';
import { userApi, type ApplicationRow, type ApplicationStatus, type KanbanBoard } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

const COLUMNS: { key: ApplicationStatus; label: string; color: string; bg: string; border: string; icon: React.ReactNode }[] = [
  { key: 'saved',     label: 'Saved',     color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', icon: <Briefcase size={13} /> },
  { key: 'applied',   label: 'Applied',   color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: <Send size={13} /> },
  { key: 'interview', label: 'Interview', color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: <MessageSquare size={13} /> },
  { key: 'offer',     label: 'Offer',     color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: <Trophy size={13} /> },
  { key: 'rejected',  label: 'Rejected',  color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', icon: <XCircle size={13} /> },
];

const STATUS_OPTIONS: ApplicationStatus[] = ['saved', 'applied', 'interview', 'offer', 'rejected'];

export default function ApplicationsKanbanPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editApp, setEditApp] = useState<ApplicationRow | null>(null);

  const load = async () => {
    try { setBoard(await userApi.listApplications()); }
    catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/'); return; }
    void load();
  }, [user, userLoading, router]);

  // Optimistic status change (no drag-and-drop in v1 — click status badge to cycle)
  async function changeStatus(app: ApplicationRow, status: ApplicationStatus) {
    if (!board) return;
    // Move card between buckets optimistically
    const next: KanbanBoard = { board: { ...board.board }, total: board.total };
    next.board[app.status] = next.board[app.status].filter(a => a.id !== app.id);
    next.board[status] = [{ ...app, status }, ...next.board[status]];
    setBoard(next);
    try { await userApi.updateApplication(app.id, { status }); }
    catch { await load(); /* refetch on failure */ }
  }

  async function deleteApp(id: string) {
    if (!confirm('Delete this application?')) return;
    try {
      await userApi.deleteApplication(id);
      await load();
    } catch { /* silent */ }
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '96px 24px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Briefcase size={22} /> Application tracker
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {board ? `${board.total} application${board.total === 1 ? '' : 's'}` : 'Loading…'}
          </p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn btn-blue btn-sm">
          <Plus size={13} /> Add application
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Loader2 size={24} className="spin" style={{ color: '#94a3b8' }} />
        </div>
      ) : !board || board.total === 0 ? (
        <EmptyState onAdd={() => setAddOpen(true)} />
      ) : (
        <div className="kanban-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(220px, 1fr))',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 8,
        }}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.key}
              column={col}
              items={board.board[col.key]}
              onChangeStatus={changeStatus}
              onDelete={deleteApp}
              onEdit={setEditApp}
            />
          ))}
        </div>
      )}

      {addOpen && (
        <ApplicationFormModal
          mode="create"
          onClose={() => setAddOpen(false)}
          onSaved={async () => { setAddOpen(false); await load(); }}
        />
      )}
      {editApp && (
        <ApplicationFormModal
          mode="edit"
          initial={editApp}
          onClose={() => setEditApp(null)}
          onSaved={async () => { setEditApp(null); await load(); }}
        />
      )}

      <style>{`
        @keyframes _spin { to { transform: rotate(360deg); } }
        .spin { animation: _spin 1s linear infinite; }
        @media (max-width: 900px) {
          .kanban-grid { grid-template-columns: repeat(5, 260px) !important; }
        }
      `}</style>
    </div>
  );
}

// ── Column ─────────────────────────────────────────────────────────────────
function KanbanColumn({ column, items, onChangeStatus, onDelete, onEdit }: {
  column: typeof COLUMNS[number];
  items: ApplicationRow[];
  onChangeStatus: (app: ApplicationRow, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (app: ApplicationRow) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 200 }}>
      <div style={{
        padding: '10px 12px', background: column.bg, border: `1px solid ${column.border}`,
        borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: column.color, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.05 }}>
          {column.icon} {column.label}
        </div>
        <span style={{ fontSize: 11, color: column.color, fontWeight: 700 }}>{items.length}</span>
      </div>
      <div style={{
        flex: 1, padding: 8, background: '#fff',
        border: `1px solid ${column.border}`, borderTop: 'none',
        borderRadius: '0 0 10px 10px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {items.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#cbd5e1', fontSize: 11 }}>
            Empty
          </div>
        ) : (
          items.map(app => (
            <ApplicationCard
              key={app.id}
              app={app}
              accentColor={column.color}
              onChangeStatus={(s) => onChangeStatus(app, s)}
              onDelete={() => onDelete(app.id)}
              onEdit={() => onEdit(app)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────
function ApplicationCard({ app, accentColor, onChangeStatus, onDelete, onEdit }: {
  app: ApplicationRow;
  accentColor: string;
  onChangeStatus: (s: ApplicationStatus) => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const followUpDate = app.next_follow_up ? new Date(app.next_follow_up) : null;
  const isOverdue = followUpDate && followUpDate < new Date() && app.status !== 'rejected' && app.status !== 'offer';

  return (
    <div
      onClick={onEdit}
      style={{
        padding: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
        borderLeft: `3px solid ${accentColor}`,
        cursor: 'pointer', transition: 'border-color .15s',
      }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginBottom: 2, lineHeight: 1.35 }}>
        {app.role}
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
        {app.company}
      </div>

      {followUpDate && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 10, color: isOverdue ? '#dc2626' : '#64748b',
          background: isOverdue ? '#fef2f2' : '#f8fafc',
          padding: '3px 6px', borderRadius: 4, marginBottom: 6,
        }}>
          <Calendar size={9} />
          Follow up {followUpDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
        <select
          value={app.status}
          onChange={e => onChangeStatus(e.target.value as ApplicationStatus)}
          style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 5,
            border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569',
            cursor: 'pointer',
          }}
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={onDelete} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card" style={{ padding: 48, textAlign: 'center' }}>
      <Briefcase size={36} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
      <p style={{ color: '#0f172a', margin: '0 0 6px', fontWeight: 600 }}>No applications yet</p>
      <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 18px' }}>
        Track every job you apply to — never lose context again.
      </p>
      <button onClick={onAdd} className="btn btn-blue">
        <Plus size={13} /> Add your first
      </button>
    </div>
  );
}

// ── Add/Edit modal ─────────────────────────────────────────────────────────
function ApplicationFormModal({ mode, initial, onClose, onSaved }: {
  mode: 'create' | 'edit';
  initial?: ApplicationRow;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] = useState({
    company: initial?.company ?? '',
    role: initial?.role ?? '',
    job_link: initial?.job_link ?? '',
    status: (initial?.status ?? 'saved') as ApplicationStatus,
    notes: initial?.notes ?? '',
    applied_at: initial?.applied_at ? initial.applied_at.slice(0, 10) : '',
    next_follow_up: initial?.next_follow_up ? initial.next_follow_up.slice(0, 10) : '',
    offered_salary: initial?.offered_salary ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const payload = {
        company: form.company.trim(),
        role: form.role.trim(),
        job_link: form.job_link.trim() || undefined,
        status: form.status,
        notes: form.notes.trim() || undefined,
        applied_at: form.applied_at || undefined,
        next_follow_up: form.next_follow_up || undefined,
        offered_salary: form.offered_salary.trim() || undefined,
      };
      if (mode === 'create') {
        await userApi.createApplication(payload);
      } else if (initial) {
        await userApi.updateApplication(initial.id, {
          status: payload.status,
          notes: payload.notes,
          applied_at: payload.applied_at || null,
          next_follow_up: payload.next_follow_up || null,
          offered_salary: payload.offered_salary,
        });
      }
      await onSaved();
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      // Scrollable backdrop — see AuthModal for the centering + scroll pattern.
      // The application form has many fields and would overflow short viewports.
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '88px 16px 24px',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
      }}
      onClick={onClose}
    >
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: -1 }}
        aria-hidden="true"
      />
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{ position: 'relative', width: '100%', maxWidth: 520, padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.18)', margin: 'auto' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 6 }}>
          <X size={18} />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
          {mode === 'create' ? 'Add application' : 'Edit application'}
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 18px' }}>
          Track jobs from any source — including those outside our board.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Company *">
              <input className="input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required maxLength={200} disabled={mode === 'edit'} />
            </Field>
            <Field label="Role *">
              <input className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required maxLength={200} disabled={mode === 'edit'} />
            </Field>
          </div>
          <Field label="Job link">
            <input className="input" value={form.job_link} onChange={e => setForm(f => ({ ...f, job_link: e.target.value }))} placeholder="https://..." maxLength={500} disabled={mode === 'edit'} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Status">
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ApplicationStatus }))}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
              </select>
            </Field>
            <Field label="Offered salary">
              <input className="input" value={form.offered_salary} onChange={e => setForm(f => ({ ...f, offered_salary: e.target.value }))} placeholder="₹18L" maxLength={60} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Applied on">
              <input type="date" className="input" value={form.applied_at} onChange={e => setForm(f => ({ ...f, applied_at: e.target.value }))} />
            </Field>
            <Field label="Next follow-up">
              <input type="date" className="input" value={form.next_follow_up} onChange={e => setForm(f => ({ ...f, next_follow_up: e.target.value }))} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value.slice(0, 2000) }))} rows={3} maxLength={2000} style={{ resize: 'vertical', fontFamily: 'inherit' }} placeholder="Interviewers, prep notes, salary expectations…" />
          </Field>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#dc2626' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={busy || (!form.company.trim() && mode === 'create') || (!form.role.trim() && mode === 'create')} className="btn btn-blue btn-sm">
              {busy ? <Loader2 size={12} className="spin" /> : <CheckCircle2 size={12} />}
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</span>
      {children}
    </label>
  );
}
