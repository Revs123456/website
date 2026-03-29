'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar, Clock, User, Mail, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import DeleteModal from '@/components/DeleteModal';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Normalize any date value (string "2026-03-29", ISO "2026-03-29T...", or Date object) to "YYYY-MM-DD"
function normDate(d: any): string {
  if (!d) return '';
  const s = typeof d === 'string' ? d : (d instanceof Date ? d.toISOString() : String(d));
  // If starts with YYYY-MM-DD just take first 10
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // Fallback: parse and use local date parts
  const dt = new Date(s);
  if (isNaN(dt.getTime())) return s.slice(0, 10);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function addOneHour(t: string) {
  const [h, m] = t.split(':').map(Number);
  const total = h * 60 + m + 60;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function toMins(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

export default function AdminAvailabilityPage() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ date: '' });
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'available' | 'booked'>('all');
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editTime, setEditTime] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const load = () => {
    setLoading(true);
    api.slots.listAll().then(setSlots).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const toggleTime = (t: string) =>
    setSelectedTimes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  // Block past times when date is today (uses browser local time = IST for user)
  const nowMins = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); })();
  function isPastTime(t: string) {
    return form.date === today && toMins(t) <= nowMins;
  }

  // A time T (1-hour slot T→T+60) is blocked if it overlaps any existing slot on that date
  // or any already-selected time in this session.
  const existingSlotsForDate = slots.filter(s => normDate(s.date) === form.date);
  function overlapsExisting(t: string) {
    const start = toMins(t);
    const end = start + 60;
    return existingSlotsForDate.some(s => start < toMins(s.end_time) && end > toMins(s.start_time));
  }
  function overlapsSelected(t: string) {
    const start = toMins(t);
    const end = start + 60;
    return selectedTimes.some(sel => {
      const sStart = toMins(sel);
      const sEnd = sStart + 60;
      return start < sEnd && end > sStart && sel !== t;
    });
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || selectedTimes.length === 0) {
      setSaveError('Pick at least one time slot.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await Promise.all(
        selectedTimes.map(t => api.slots.create({ date: form.date, start_time: t, end_time: addOneHour(t) }))
      );
      setShowForm(false);
      setForm({ date: '' });
      setSelectedTimes([]);
      load();
    }
    catch (err: any) { setSaveError(err?.message || 'Failed to create slots. Please try again.'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await api.slots.remove(deleteTarget.id); setDeleteTarget(null); load(); }
    catch { setDeleteTarget(null); }
    finally { setDeleting(false); }
  };

  const saveEdit = async () => {
    if (!editTarget || !editTime) return;
    setEditSaving(true);
    setEditError('');
    try {
      await api.slots.update(editTarget.id, { start_time: editTime, end_time: addOneHour(editTime) });
      setEditTarget(null);
      load();
    } catch (err: any) { setEditError(err?.message || 'Failed to update slot.'); }
    finally { setEditSaving(false); }
  };

  const toggle = async (slot: any) => {
    try { await api.slots.toggle(slot.id); load(); }
    catch { alert('Failed to update slot.'); }
  };

  const today = new Date().toISOString().slice(0, 10);
  const filtered = slots.filter(s => {
    const d = normDate(s.date);
    return filter === 'all' ? true : filter === 'booked' ? s.is_booked : (!s.is_booked && s.is_active && d >= today);
  });

  const available = slots.filter(s => !s.is_booked && s.is_active && normDate(s.date) >= today).length;
  const booked = slots.filter(s => s.is_booked).length;

  const slotsByDate = slots.reduce((acc: Record<string, any[]>, s) => {
    const key = normDate(s.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
    setSelectedDate(null);
  };

  const dateStr = (day: number) =>
    `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Filter directly — avoids key mismatch from slotsByDate
  const selectedSlots = selectedDate
    ? slots.filter(s => normDate(s.date) === selectedDate)
    : [];

  return (
    <div>
      {deleteTarget && (
        <DeleteModal
          title="Delete Slot?"
          name={`${fmtDate(deleteTarget.date)} · ${fmt12(deleteTarget.start_time)}`}
          deleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Edit Slot Modal */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', padding: 24 }}>
          <div className="card" style={{ width: '100%', maxWidth: 380, padding: 28 }}>
            <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginBottom: 4 }}>Edit Slot</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>{fmtDate(editTarget.date)}</p>
            {editError && (
              <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>{editError}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>New Start Time</label>
                <select value={editTime} onChange={e => setEditTime(e.target.value)} className="input">
                  {TIME_OPTIONS.filter(t => {
                    // Block times that overlap other slots on that date (excluding this slot)
                    const start = toMins(t); const end = start + 60;
                    return !slots
                      .filter(s => normDate(s.date) === normDate(editTarget.date) && s.id !== editTarget.id)
                      .some(s => start < toMins(s.end_time) && end > toMins(s.start_time));
                  }).map(t => <option key={t} value={t}>{fmt12(t)}</option>)}
                </select>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={13} style={{ color: '#2563eb' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>
                  {fmt12(editTime)} – {fmt12(addOneHour(editTime))} (1 hour)
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => { setEditTarget(null); setEditError(''); }} className="btn btn-outline btn-sm">Cancel</button>
                <button onClick={saveEdit} disabled={editSaving} className="btn btn-blue btn-sm" style={{ opacity: editSaving ? 0.7 : 1 }}>
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Availability</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
            {available} available · {booked} booked
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
            {(['calendar', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                  background: view === v ? '#fff' : 'transparent',
                  color: view === v ? '#0f172a' : '#94a3b8',
                  boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}>
                {v === 'calendar' ? '📅 Calendar' : '☰ List'}
              </button>
            ))}
          </div>
          <button className="btn btn-blue btn-sm" onClick={() => { setShowForm(true); setSaveError(''); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add Slot
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Slots', val: slots.length, c: '#2563eb', bg: '#eff6ff' },
          { label: 'Available', val: available, c: '#059669', bg: '#f0fdf4' },
          { label: 'Booked', val: booked, c: '#7c3aed', bg: '#f5f3ff' },
        ].map(({ label, val, c, bg }) => (
          <div key={label} className="card" style={{ padding: '16px 20px', background: bg, border: `1px solid ${c}20` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: c }}>{val}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Add Slot Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', padding: 24 }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginBottom: 6 }}>Add Time Slots</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Pick a date then select one or more 1-hour slots.</p>
            {saveError && (
              <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>{saveError}</div>
            )}
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Date *</label>
                <input required type="date" name="date" value={form.date} onChange={e => { change(e); setSelectedTimes([]); }} className="input" min={today} />
              </div>

              {form.date && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={lbl}>Select Time Slots</label>
                    {selectedTimes.length > 0 && (
                      <button type="button" onClick={() => setSelectedTimes([])}
                        style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Clear all
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {TIME_OPTIONS.map(t => {
                      const selected = selectedTimes.includes(t);
                      const blockedByPast = isPastTime(t);
                      const blockedByExisting = !blockedByPast && overlapsExisting(t);
                      const blockedBySelected = !blockedByPast && !selected && overlapsSelected(t);
                      const blocked = blockedByPast || blockedByExisting || blockedBySelected;
                      return (
                        <button
                          key={t} type="button"
                          disabled={blocked}
                          onClick={() => toggleTime(t)}
                          style={{
                            padding: '7px 4px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            border: `1.5px solid ${blocked ? '#e2e8f0' : selected ? '#2563eb' : '#e2e8f0'}`,
                            background: blocked ? '#f8fafc' : selected ? '#eff6ff' : '#fff',
                            color: blocked ? '#cbd5e1' : selected ? '#2563eb' : '#475569',
                            cursor: blocked ? 'not-allowed' : 'pointer',
                            transition: 'all 0.1s',
                            textAlign: 'center',
                          }}
                        >
                          {fmt12(t)}
                          {blockedByPast && <span style={{ display: 'block', fontSize: 9, color: '#94a3b8', fontWeight: 400 }}>past</span>}
                          {blockedByExisting && <span style={{ display: 'block', fontSize: 9, color: '#94a3b8', fontWeight: 400 }}>taken</span>}
                          {blockedBySelected && <span style={{ display: 'block', fontSize: 9, color: '#94a3b8', fontWeight: 400 }}>overlap</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedTimes.length > 0 && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {selectedTimes.length} slot{selectedTimes.length > 1 ? 's' : ''} selected
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {[...selectedTimes].sort().map(t => (
                      <span key={t} style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', background: '#dbeafe', borderRadius: 6, padding: '2px 8px' }}>
                        {fmt12(t)} – {fmt12(addOneHour(t))}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button type="button" onClick={() => { setShowForm(false); setSelectedTimes([]); }} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" disabled={saving || selectedTimes.length === 0} className="btn btn-blue btn-sm" style={{ opacity: (saving || selectedTimes.length === 0) ? 0.6 : 1 }}>
                  {saving ? 'Saving…' : `Add ${selectedTimes.length > 0 ? selectedTimes.length + ' ' : ''}Slot${selectedTimes.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CALENDAR VIEW ── */}
      {view === 'calendar' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <button onClick={prevMonth} style={navBtn}><ChevronLeft size={16} /></button>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{MONTHS[calMonth]} {calYear}</span>
              <button onClick={nextMonth} style={navBtn}><ChevronRight size={16} /></button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f1f5f9' }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', padding: '8px 4px', fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>{d}</div>
              ))}
            </div>

            {/* Date cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {/* Empty leading cells */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} style={{ minHeight: 80, borderRight: '1px solid #f8fafc', borderBottom: '1px solid #f8fafc' }} />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const ds = dateStr(day);
                const daySlots = slotsByDate[ds] || [];
                const avail = daySlots.filter(s => !s.is_booked && s.is_active).length;
                const bkd = daySlots.filter(s => s.is_booked).length;
                const isToday = ds === today;
                const isPast = ds < today;
                const isSelected = ds === selectedDate;

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : ds)}
                    style={{
                      minHeight: 90, padding: '6px 6px', borderRight: '1px solid #f8fafc', borderBottom: '1px solid #f8fafc',
                      cursor: daySlots.length > 0 ? 'pointer' : 'default',
                      background: isSelected ? '#eff6ff' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Day number */}
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: isToday ? 700 : 500,
                      background: isToday ? '#2563eb' : 'transparent',
                      color: isToday ? '#fff' : isPast ? '#cbd5e1' : '#0f172a',
                      marginBottom: 4,
                    }}>
                      {day}
                    </div>
                    {/* Slot times */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[...daySlots]
                        .sort((a, b) => a.start_time.localeCompare(b.start_time))
                        .slice(0, 3)
                        .map(s => (
                          <div key={s.id} style={{
                            fontSize: 9, fontWeight: 700, borderRadius: 3, padding: '1px 4px', lineHeight: 1.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            background: s.is_booked ? '#f5f3ff' : s.is_active ? '#f0fdf4' : '#f8fafc',
                            color: s.is_booked ? '#7c3aed' : s.is_active ? '#059669' : '#94a3b8',
                          }}>
                            {fmt12(s.start_time)}
                          </div>
                        ))}
                      {daySlots.length > 3 && (
                        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, padding: '0 4px' }}>
                          +{daySlots.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, padding: '12px 20px', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
              <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#059669', display: 'inline-block' }} /> Available
              </span>
              <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#7c3aed', display: 'inline-block' }} /> Booked
              </span>
              <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#94a3b8', display: 'inline-block' }} /> Inactive
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>Click a date to manage</span>
            </div>
          </div>

          {/* Selected date slot detail panel */}
          {selectedDate && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>
                {fmtDate(selectedDate)}
                <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>
                  {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''}
                </span>
              </div>
              {selectedSlots.length === 0 ? (
                <p style={{ fontSize: 13, color: '#94a3b8' }}>No slots for this date.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedSlots.sort((a, b) => a.start_time.localeCompare(b.start_time)).map(slot => (
                    <div key={slot.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      borderRadius: 8, border: '1px solid', flexWrap: 'wrap',
                      background: slot.is_booked ? '#faf5ff' : slot.is_active ? '#f0fdf4' : '#f8fafc',
                      borderColor: slot.is_booked ? '#ddd6fe' : slot.is_active ? '#bbf7d0' : '#e2e8f0',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 140 }}>
                        <Clock size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                          {fmt12(slot.start_time)} – {fmt12(slot.end_time)}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: slot.is_booked ? '#ede9fe' : '#dcfce7',
                        color: slot.is_booked ? '#7c3aed' : '#059669',
                      }}>
                        {slot.is_booked ? 'Booked' : 'Available'}
                      </span>
                      {slot.is_booked && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginLeft: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <User size={11} style={{ color: '#94a3b8' }} />{slot.booked_name}
                          </span>
                          <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={11} style={{ color: '#94a3b8' }} />{slot.booked_email}
                          </span>
                        </div>
                      )}
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button onClick={() => toggle(slot)} title={slot.is_active ? 'Deactivate' : 'Activate'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: slot.is_active ? '#2563eb' : '#94a3b8', display: 'flex', alignItems: 'center', padding: 0 }}>
                          {slot.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        {!slot.is_booked && (
                          <button onClick={() => { setEditTarget(slot); setEditTime(slot.start_time); setEditError(''); }} style={iconBtn} title="Edit">
                            <Pencil size={12} style={{ color: '#2563eb' }} />
                          </button>
                        )}
                        <button onClick={() => setDeleteTarget(slot)} style={iconBtn} title="Delete">
                          <Trash2 size={12} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['all', 'available', 'booked'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid', cursor: 'pointer', textTransform: 'capitalize',
                  background: filter === f ? '#2563eb' : '#f8fafc',
                  color: filter === f ? '#fff' : '#64748b',
                  borderColor: filter === f ? '#2563eb' : '#e2e8f0',
                }}>
                {f}
              </button>
            ))}
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
                <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                <p>No slots found. Add your first availability slot.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {['Date', 'Time', 'Status', 'Booked By', 'Active', ''].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(slot => (
                      <tr key={slot.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Calendar size={13} style={{ color: '#94a3b8' }} />
                            {fmtDate(slot.date)}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}>
                            <Clock size={13} style={{ color: '#94a3b8' }} />
                            {fmt12(slot.start_time)} – {fmt12(slot.end_time)}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                            background: slot.is_booked ? '#f5f3ff' : '#f0fdf4',
                            color: slot.is_booked ? '#7c3aed' : '#059669',
                            border: `1px solid ${slot.is_booked ? '#ddd6fe' : '#bbf7d0'}`,
                          }}>
                            {slot.is_booked ? 'Booked' : 'Available'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {slot.is_booked ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0f172a', fontWeight: 600 }}>
                                <User size={11} style={{ color: '#94a3b8' }} />{slot.booked_name}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 12 }}>
                                <Mail size={11} style={{ color: '#94a3b8' }} />{slot.booked_email}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button onClick={() => toggle(slot)} title={slot.is_active ? 'Deactivate' : 'Activate'}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: slot.is_active ? '#2563eb' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
                            {slot.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                          </button>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button onClick={() => setDeleteTarget(slot)} style={iconBtn} title="Delete">
                            <Trash2 size={13} style={{ color: '#ef4444' }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' };
const iconBtn: React.CSSProperties = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' };
const navBtn: React.CSSProperties = { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#475569' };
