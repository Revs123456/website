'use client';
import { useEffect, useState } from 'react';
import { BellRing, X, Loader2 } from 'lucide-react';
import { userApi } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

const DISMISS_KEY = 'tch_push_dismissed_until';

/**
 * Pulls double duty: subscribes the user to web push AND lets them dismiss the prompt.
 *
 * Trigger logic (deliberately quiet — push prompts are annoying when wrong):
 *   - Only shown to logged-in users (anonymous can't receive push anyway)
 *   - Skipped if:
 *     - browser doesn't support push,
 *     - permission is already granted (we re-sync silently in background),
 *     - permission is denied (the system blocked us; banner can't help),
 *     - user dismissed within last 30 days,
 *     - VAPID isn't configured server-side
 *   - Delayed 30s after page load — doesn't compete with the user's first task
 *
 * Mounted next to other layout components.
 */
export default function PushOptInBanner() {
  const { user } = useUser();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  // Other fixed-position UI (the chat FAB/window) reads this CSS var to shift
  // itself up while this banner occupies the bottom-right corner, instead of
  // the two silently overlapping.
  useEffect(() => {
    document.documentElement.style.setProperty('--push-banner-offset', show ? '90px' : '0px');
    return () => { document.documentElement.style.setProperty('--push-banner-offset', '0px'); };
  }, [show]);

  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

    // Dismiss cooldown
    const dismissedUntil = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
    if (Date.now() < dismissedUntil) return;

    // Permission gate
    if (Notification.permission === 'denied') return;
    if (Notification.permission === 'granted') {
      // User already granted — silently re-sync the subscription if missing.
      // Browsers occasionally lose subscriptions; this self-heals.
      void resyncSubscription();
      return;
    }

    (async () => {
      try {
        const { key, enabled } = await userApi.pushVapidPublicKey();
        if (!enabled || !key) return;     // server-side push disabled
        setVapidKey(key);
        // Delay so we don't blast users on first paint
        setTimeout(() => setShow(true), 30_000);
      } catch { /* silent */ }
    })();
  }, [user]);

  async function enable() {
    if (!vapidKey) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        // User denied — record dismissal so we don't ask again
        localStorage.setItem(DISMISS_KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000));
        setShow(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
      const json = sub.toJSON() as any;
      await userApi.pushSubscribe({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setShow(false);
    } catch (err) {
      // Permission flow can throw if user dismisses the native dialog — that's fine
      console.warn('Push subscription failed:', err);
      setShow(false);
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Enable push notifications"
      style={{
        position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 89,
        maxWidth: 380, margin: '0 auto',
        background: '#fff', borderRadius: 14,
        border: '1px solid #e2e8f0',
        boxShadow: '0 16px 48px rgba(15,23,42,0.18)',
        padding: 14,
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg,#dc2626,#f59e0b)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <BellRing size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Stay in the loop</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
          Get notified for new job matches, streak reminders, and answers.
        </div>
      </div>
      <button onClick={enable} disabled={busy} className="btn btn-blue btn-sm" style={{ flexShrink: 0, opacity: busy ? 0.6 : 1 }}>
        {busy ? <Loader2 size={12} className="spin" /> : <BellRing size={12} />}
        {busy ? 'Enabling…' : 'Enable'}
      </button>
      <button onClick={dismiss} aria-label="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 6, flexShrink: 0 }}>
        <X size={16} />
      </button>
      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}

/**
 * Re-subscribes the user silently if the subscription was lost (browser
 * cleanup, profile sync, etc.). No-op if already subscribed.
 */
async function resyncSubscription() {
  if (typeof window === 'undefined') return;
  try {
    const { key, enabled } = await userApi.pushVapidPublicKey();
    if (!enabled || !key) return;
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return;     // already subscribed
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
    });
    const json = sub.toJSON() as any;
    await userApi.pushSubscribe({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    });
  } catch { /* silent — re-sync is best-effort */ }
}

/**
 * VAPID keys are base64url-encoded. The PushManager wants a BufferSource backed
 * by an ArrayBuffer (not SharedArrayBuffer — TS 5.x is strict about this).
 *
 * We allocate a fresh ArrayBuffer explicitly so the resulting view's backing
 * type is unambiguous.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
