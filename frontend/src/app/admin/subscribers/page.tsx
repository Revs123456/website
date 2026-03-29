'use client';
import { useEffect, useState } from 'react';
import { Trash2, Download, ToggleLeft, ToggleRight, Users } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
function getToken() { try { return typeof window !== 'undefined' ? localStorage.getItem('tch_token') : null; } catch { return null; } }
function authHeaders() { const t = getToken(); return { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }; }

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

export default function AdminSubscribersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/subscribers`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(item: any) {
    try {
      await fetch(`${BASE}/subscribers/${item.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ active: !item.active }),
      });
      load();
    } catch {
      alert('Failed to update subscriber.');
    }
  }

  async function del(id: string) {
    if (!confirm('Delete this subscriber?')) return;
    try {
      await fetch(`${BASE}/subscribers/${id}`, { method: 'DELETE' });
      load();
    } catch {
      alert('Failed to delete subscriber.');
    }
  }

  function exportCSV() {
    if (items.length === 0) return;
    const headers = ['Email', 'WhatsApp', 'Type', 'Active', 'Created'];
    const rows = items.map(s => [
      s.email ?? '',
      s.whatsapp ?? '',
      s.type ?? '',
      s.active ? 'Yes' : 'No',
      s.created_at ? new Date(s.created_at).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Subscribers</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{items.length} subscribers</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={exportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? <LoadingSpinner /> : items.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p>No subscribers yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Email', 'WhatsApp', 'Type', 'Active', 'Created', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{item.email}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{item.whatsapp || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-slate">{item.type || '—'}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${item.active ? 'badge-green' : 'badge-slate'}`}>
                        {item.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8' }}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => toggleActive(item)}
                          style={iconBtn}
                          title={item.active ? 'Deactivate' : 'Activate'}
                        >
                          {item.active ? <ToggleRight size={15} style={{ color: '#22c55e' }} /> : <ToggleLeft size={15} />}
                        </button>
                        <button onClick={() => del(item.id)} style={{ ...iconBtn, color: '#ef4444' }} title="Delete">
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

const iconBtn: React.CSSProperties = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#64748b', display: 'inline-flex', alignItems: 'center' };
