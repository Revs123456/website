'use client';
import { useEffect, useState } from 'react';
import { Trash2, ShoppingBag, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

const STATUS_BADGE: Record<string, string> = {
  Completed:     'badge-green',
  completed:     'badge-green',
  'In Progress': 'badge-blue',
  in_progress:   'badge-blue',
  Pending:       'badge-amber',
  pending:       'badge-amber',
};

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#d97706', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.orders.list().then(setOrders).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm('Delete this order?')) return;
    try { await api.orders.delete(id); load(); }
    catch { alert('Failed to delete order.'); }
  };

  return (
    <div>
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
                  {['#', 'Customer', 'Email', 'Service', 'Experience', 'Date', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any, i: number) => (
                  <tr key={o.id || i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: 11 }}>#{o.id || i + 1}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {o.customer_name || o.name || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      {o.customer_email || o.email || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {o.service?.name || o.service_name || (o.service_id ? `Plan #${o.service_id}` : '—')}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8' }}>
                      {o.experience_level || o.level || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${STATUS_BADGE[o.status] || 'badge-amber'}`}>
                        {o.status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => del(o.id)}
                        style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#ef4444', display: 'inline-flex', alignItems: 'center' }}
                        title="Delete order"
                      >
                        <Trash2 size={13} />
                      </button>
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
