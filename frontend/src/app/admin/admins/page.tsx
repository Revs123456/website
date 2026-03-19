'use client';
import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Shield, Eye, EyeOff } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<{ id: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchAdmins() {
    try {
      const res = await fetch(`${BASE}/auth/admins`);
      const data = await res.json();
      setAdmins(data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchAdmins(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Email and password are required'); return; }
    setAdding(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${BASE}/auth/create-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (data.message === 'Admin already exists') {
        setError('An admin with this email already exists.');
      } else {
        setSuccess(`Admin "${email}" added successfully.`);
        setEmail(''); setPassword('');
        fetchAdmins();
      }
    } catch { setError('Failed to add admin.'); }
    setAdding(false);
  }

  async function handleDelete(id: string, adminEmail: string) {
    const current = localStorage.getItem('tch_auth');
    if (current) {
      const { email: me } = JSON.parse(current);
      if (me === adminEmail) { setError("You can't remove your own account."); return; }
    }
    if (!confirm(`Remove admin "${adminEmail}"?`)) return;
    await fetch(`${BASE}/auth/admins/${id}`, { method: 'DELETE' });
    fetchAdmins();
  }

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Admin Users</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Manage who has access to this admin panel.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, alignItems: 'start' }}>

        {/* Add Admin Form */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={15} style={{ color: '#2563eb' }} />
            </div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Add New Admin</h2>
          </div>

          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com" required
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Set a strong password" required
                  style={{ width: '100%', padding: '9px 36px 9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#dc2626' }}>{error}</div>
            )}
            {success && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#16a34a' }}>{success}</div>
            )}

            <button type="submit" disabled={adding} className="btn btn-blue"
              style={{ width: '100%', justifyContent: 'center', gap: 6, opacity: adding ? 0.7 : 1 }}>
              <UserPlus size={13} /> {adding ? 'Adding…' : 'Add Admin'}
            </button>
          </form>
        </div>

        {/* Existing Admins List */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Current Admins</h2>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{admins.length} total</span>
          </div>

          {loading ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading…</div>
          ) : admins.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No admins found.</div>
          ) : (
            <div>
              {admins.map((admin, i) => (
                <div key={admin.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: i < admins.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Shield size={14} style={{ color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin.email}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>Administrator</p>
                  </div>
                  <button
                    onClick={() => handleDelete(admin.id, admin.email)}
                    style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Remove admin"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
