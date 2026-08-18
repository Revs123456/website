'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Loader2, Check, ArrowRight } from 'lucide-react';
import { userApi, type NotificationRow } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/'); return; }
    (async () => {
      try { setItems(await userApi.listNotifications(100)); }
      catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [user, userLoading, router]);

  async function markAll() {
    try { await userApi.markAllNotificationsRead(); } catch { /* silent */ }
    setItems(prev => prev.map(x => ({ ...x, read: true, read_at: new Date().toISOString() })));
  }

  async function handleClick(n: NotificationRow) {
    if (!n.read) {
      try { await userApi.markNotificationRead(n.id); } catch { /* silent */ }
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    }
    if (n.link_url) router.push(n.link_url);
  }

  const unreadCount = items.filter(x => !x.read).length;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '96px 24px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={24} /> Notifications
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAll} className="btn btn-outline btn-sm">
            <Check size={13} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={24} className="spin" style={{ color: '#94a3b8' }} />
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Bell size={36} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', margin: 0 }}>
            No notifications yet. We&apos;ll let you know when something matters.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {items.map((n, i) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '14px 18px', width: '100%', textAlign: 'left',
                background: n.read ? '#fff' : '#eff6ff',
                border: 'none', borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
                cursor: 'pointer',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: '#0f172a', marginBottom: 3 }}>
                  {n.title}
                </div>
                {n.body && (
                  <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
                    {n.body}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                  {timeAgo(n.created_at)}
                </div>
              </div>
              {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', marginTop: 8, flexShrink: 0 }} />}
              {n.link_url && <ArrowRight size={13} style={{ color: '#94a3b8', marginTop: 4, flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
