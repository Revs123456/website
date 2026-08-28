'use client';
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

/**
 * Registers the service worker AND shows a non-intrusive install prompt.
 *
 * Behavior:
 *   - On mount: registers /sw.js (idempotent — browser skips if already registered)
 *   - Listens for `beforeinstallprompt` — Chrome/Edge fire this when site
 *     meets PWA installability criteria (manifest + SW + HTTPS)
 *   - Shows a small bottom banner. User can install or dismiss.
 *   - Dismiss is sticky for 14 days via localStorage.
 *
 * Mounted once in the public layout. No-op on iOS Safari (no prompt API yet
 * — those users get a separate "Add to Home Screen" hint via iOS UI).
 */
const DISMISS_KEY = 'tch_pwa_dismissed_until';

export default function PWARegistrar() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  // ── Register the service worker (idempotent) ──────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    // Defer until idle so we don't compete with page-load critical resources
    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Silent — SW registration failure shouldn't break the page
      });
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(register);
    } else {
      setTimeout(register, 1500);
    }
  }, []);

  // ── Capture beforeinstallprompt + show banner ─────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (e: Event) => {
      e.preventDefault();      // suppress Chrome's default mini-infobar
      setInstallPrompt(e);
      // Check dismissal cooldown
      const dismissedUntil = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
      if (Date.now() < dismissedUntil) return;
      // Delay 8s so the banner doesn't compete with first paint
      setTimeout(() => setShow(true), 8000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!installPrompt) return;
    installPrompt.prompt();
    try { await installPrompt.userChoice; } catch { /* ignore */ }
    setInstallPrompt(null);
    setShow(false);
  }

  function dismiss() {
    // 14-day cooldown — long enough to not be annoying, short enough that
    // users who change their mind don't have to clear storage
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 14 * 24 * 60 * 60 * 1000));
    setShow(false);
  }

  if (!show || !installPrompt) return null;

  return (
    <div
      role="dialog"
      aria-label="Install TechChampsByRev"
      style={{
        position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 90,
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
        background: 'linear-gradient(135deg,#2563eb,var(--brand-violet))', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Download size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Install TechChamps</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
          One tap. Lives on your home screen. Works offline.
        </div>
      </div>
      <button onClick={install} className="btn btn-blue btn-sm" style={{ flexShrink: 0 }}>
        Install
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 6, flexShrink: 0 }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
