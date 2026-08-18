'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Check, ArrowRight } from 'lucide-react';
import { userApi, type NotificationRow } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

/**
 * Navbar bell with unread count + dropdown of recent notifications.
 * Polls /notifications/unread-count every 30s — cheap aggregate query.
 * Phase 7 will replace polling with Web Push for instant delivery.
 *
 * Click bell → fetch notifications list (deferred until first open).
 * Click any item → mark read + navigate to link_url.
 */
export default function NotificationBell() {
  const { user } = useUser();
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Poll the unread count every 30s. Only when logged in.
  useEffect(() => {
    if (!user) { setCount(0); return; }
    let active = true;
    const fetchCount = async () => {
      try {
        const res = await userApi.unreadNotificationCount();
        if (active) setCount(res.count);
      } catch { /* silent — bell is optional */ }
    };
    void fetchCount();
    const i = setInterval(fetchCount, 30_000);
    return () => { active = false; clearInterval(i); };
  }, [user]);

  // Click-outside to close
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  async function handleOpen() {
    setOpen(o => !o);
    if (!open && !items) {
      setLoading(true);
      try {
        const list = await userApi.listNotifications(10);
        setItems(list);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
  }

  async function handleItemClick(n: NotificationRow) {
    if (!n.read) {
      try { await userApi.markNotificationRead(n.id); } catch { /* silent */ }
      setItems(prev => prev?.map(x => x.id === n.id ? { ...x, read: true } : x) || null);
      setCount(c => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link_url) router.push(n.link_url);
  }

  async function markAll() {
    try { await userApi.markAllNotificationsRead(); } catch { /* silent */ }
    setItems(prev => prev?.map(x => ({ ...x, read: true })) || null);
    setCount(0);
  }

  if (!user) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: '50%',
          background: open ? '#f1f5f9' : 'transparent', border: '1px solid #e2e8f0',
          cursor: 'pointer', color: '#475569', transition: 'background .15s',
        }}
      >
        <Bell size={16} />
        {count > 0 && (
          <span
            style={{
              position: 'absolute', top: -3, right: -3,
              minWidth: 18, height: 18, padding: '0 5px', borderRadius: 99,
              background: '#dc2626', color: '#fff',
              fontSize: 10, fontWeight: 800, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff',
            }}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
            boxShadow: '0 12px 40px rgba(15,23,42,0.1)',
            width: 360, maxWidth: 'calc(100vw - 32px)', padding: 6, zIndex: 60,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px 8px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Notifications</span>
            {count > 0 && (
              <button onClick={markAll} style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Loading…</div>
            ) : !items || items.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                No notifications yet. We&apos;ll let you know when something matters.
              </div>
            ) : (
              items.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    padding: '10px 12px', width: '100%', textAlign: 'left',
                    background: n.read ? 'transparent' : '#eff6ff',
                    border: 'none', cursor: 'pointer', borderRadius: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: n.read ? 500 : 700, color: '#0f172a', marginBottom: 2 }}>
                      {n.title}
                    </div>
                    {n.body && (
                      <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                        {n.body}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                  {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', marginTop: 6, flexShrink: 0 }} />}
                </button>
              ))
            )}
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', padding: '8px 12px' }}>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
            >
              See all <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      )}
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
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
