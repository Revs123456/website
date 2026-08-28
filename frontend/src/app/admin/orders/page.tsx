'use client';
import { useEffect, useState } from 'react';
import { Trash2, ShoppingBag, RefreshCw, ChevronDown, MessageSquare, Eye, X, Calendar, Clock, FileText, Download } from 'lucide-react';
import { api } from '@/lib/api';
import DeleteModal from '@/components/DeleteModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const detailLbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 };

const STATUS_BADGE: Record<string, string> = {
  Completed:     'badge-green',
  completed:     'badge-green',
  'In Progress': 'badge-blue',
  in_progress:   'badge-blue',
  Pending:       'badge-amber',
  pending:       'badge-amber',
};

function formatInr(amount: any): string {
  const n = Number(amount);
  if (!amount || Number.isNaN(n)) return '—';
  return '₹' + n.toLocaleString('en-IN');
}

import AdminSkeleton from '@/components/AdminSkeleton';
function LoadingSpinner() { return <AdminSkeleton />; }

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetails = (order: any) => {
    setDetailOrder(order);
    setDetail(null);
    setDetailLoading(true);
    api.orders.details(order.id).then(setDetail).catch(() => {}).finally(() => setDetailLoading(false));
  };

  const load = () => {
    setLoading(true);
    api.orders.list().then(setOrders).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await api.orders.delete(deleteTarget.id); setDeleteTarget(null); load(); }
    catch { setDeleteTarget(null); }
    finally { setDeleting(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await api.orders.update(id, { status }); load(); }
    catch { setError('Failed to update status.'); setTimeout(() => setError(''), 5000); }
  };

  return (
    <div>
      {deleteTarget && (
        <DeleteModal
          title="Delete Order?"
          name={deleteTarget.customer_name || deleteTarget.name || ''}
          deleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Order detail — generic across every service, no per-service UI.
          Slot / files / custom-field answers all rendered from whatever the
          order actually has, driven by the service's own field definitions.
          See SERVICES_ARCHITECTURE.md. ── */}
      {detailOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', overflowY: 'auto', padding: '40px 16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: 560, padding: 28, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>Order Details</h2>
              <button onClick={() => setDetailOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <AdminSkeleton rows={4} />
            ) : !detail ? (
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Failed to load order details.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Customer + service + payment */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                  <div>
                    <p style={detailLbl}>Customer</p>
                    <p style={{ fontWeight: 600, color: '#0f172a' }}>{detail.customer_name || detail.name || '—'}</p>
                    <p style={{ color: '#64748b', fontSize: 12 }}>{detail.customer_email || detail.email}</p>
                  </div>
                  <div>
                    <p style={detailLbl}>Service</p>
                    <p style={{ fontWeight: 600, color: '#0f172a' }}>{detail.service_type || '—'}</p>
                  </div>
                  <div>
                    <p style={detailLbl}>Amount</p>
                    <p style={{ fontWeight: 600, color: '#0f172a' }}>{formatInr(detail.amount)}</p>
                  </div>
                  <div>
                    <p style={detailLbl}>Payment</p>
                    <span className={`badge ${detail.payment_status === 'paid' ? 'badge-green' : 'badge-amber'}`}>
                      {detail.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>

                {/* Slot — only rendered when this service actually required one */}
                {detail.slot && (
                  <div>
                    <p style={detailLbl}>Scheduled Slot</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13} /> {new Date(detail.slot.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={13} /> {fmt12(detail.slot.start_time)} – {fmt12(detail.slot.end_time)}</span>
                    </div>
                  </div>
                )}

                {/* Uploaded files — only rendered when there are any */}
                {detail.files && detail.files.length > 0 && (
                  <div>
                    <p style={detailLbl}>Uploaded Files</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {detail.files.map((f: any) => (
                        <a key={f.id} href={`${API_BASE}${f.file_url}`} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none' }}>
                          <FileText size={15} style={{ color: '#64748b', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file_name}</p>
                            {f.label && <p style={{ fontSize: 11, color: '#94a3b8' }}>{f.label}</p>}
                          </div>
                          <Download size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom field answers — labeled generically from the service's
                    own field definitions, not hardcoded per service */}
                {detail.custom_field_defs?.length > 0 && (
                  <div>
                    <p style={detailLbl}>Additional Information</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {detail.custom_field_defs.map((field: any) => {
                        const val = detail.custom_field_values?.[field.key];
                        return (
                          <div key={field.key}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{field.label}</p>
                            <p style={{ fontSize: 13, color: '#374151' }}>
                              {val === undefined || val === null || val === '' ? '—' : field.type === 'checkbox' ? (val ? 'Yes' : 'No') : String(val)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {detail.message && (
                  <div>
                    <p style={detailLbl}>Message</p>
                    <p style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>{detail.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}<button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Orders</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{orders.length} total orders</p>
        </div>
        <button
          onClick={load}
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total',       val: orders.length,                                         color: '#2563eb' },
          { label: 'Pending',     val: orders.filter(o => (o.status || 'pending').toLowerCase().includes('pend')).length, color: '#d97706' },
          { label: 'In Progress', val: orders.filter(o => (o.status || '').toLowerCase().includes('progress')).length,  color: '#2563eb' },
          { label: 'Completed',   val: orders.filter(o => (o.status || '').toLowerCase().includes('complet')).length,   color: '#059669' },
          { label: 'Paid',        val: orders.filter(o => o.payment_status === 'paid').length,                          color: '#059669' },
          { label: 'Revenue (paid)', val: formatInr(orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (Number(o.amount) || 0), 0)), color: '#0f172a' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{label}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: '-0.03em' }}>{val}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <LoadingSpinner /> : orders.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <ShoppingBag size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p>No orders yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Customer', 'Service', 'Experience', 'Amount', 'Payment', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any, i: number) => (
                  <tr key={o.id || i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {o.customer_name || o.name || '—'}
                        {o.message && (
                          <span title={o.message} style={{ display: 'inline-flex', flexShrink: 0 }}>
                            <MessageSquare size={12} style={{ color: '#94a3b8' }} />
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                        {o.customer_email || o.email || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {o.service_type || (o.service_id ? `Plan #${String(o.service_id).slice(0, 8)}` : '—')}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8' }}>
                      {o.experience_level || o.level || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                      {formatInr(o.amount)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${o.payment_status === 'paid' ? 'badge-green' : 'badge-amber'}`}>
                        {o.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={o.status || 'pending'}
                        onChange={e => updateStatus(o.id, e.target.value)}
                        className="input"
                        style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, borderRadius: 6, width: 'auto', minWidth: 110 }}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => openDetails(o)}
                          style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#2563eb', display: 'inline-flex', alignItems: 'center' }}
                          title="View details"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(o)}
                          style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#ef4444', display: 'inline-flex', alignItems: 'center' }}
                          title="Delete order"
                        >
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

      {orders.length > 0 && (
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12, textAlign: 'right' }}>
          Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
