/**
 * TechChampsByRev Service Worker (Phase 7)
 *
 * Two jobs:
 *   1. Offline shell — cache /offline.html so users see something useful
 *      when their connection drops mid-session. We do NOT cache API responses
 *      or per-user pages; staleness would be worse than a network error.
 *   2. Web Push receiver — render notifications from the backend.
 *
 * No build-step required (raw JS, served from /public).
 */

const CACHE_NAME = 'tch-shell-v1';
const SHELL_URLS = ['/offline.html', '/tc.png'];

// ── Install: pre-cache the offline shell ──────────────────────────────────
self.addEventListener('install', (event) => {
  // Activate immediately on update — don't wait for tabs to close
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => undefined),
  );
});

// ── Activate: clean up old shell caches ───────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('tch-shell-') && k !== CACHE_NAME).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

// ── Fetch: pass through everything; only fallback on navigation failure ───
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept top-level navigation requests. Don't touch API/static
  // — Next.js + Vercel already handle those better than we can.
  if (request.mode !== 'navigate') return;

  event.respondWith(
    fetch(request).catch(() => caches.match('/offline.html').then((r) => r || new Response('Offline'))),
  );
});

// ── Push: render the notification ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); }
  catch { payload = { title: 'TechChampsByRev', body: event.data.text() }; }

  const { title = 'TechChampsByRev', body = '', url = '/', icon = '/tc.png' } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: icon,
      // The data field is preserved on notification click so we know where to go
      data: { url },
      tag: payload.tag || 'general',     // collapse duplicate notifications
      renotify: false,
    }),
  );
});

// ── Notification click: focus existing tab if open, else open new ─────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Prefer focusing an already-open tab on the same origin
      for (const c of clients) {
        if ('focus' in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
