'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { userApi } from '@/lib/api';

const SESSION_KEY = 'tch_analytics_session';

/** Stable per-tab id — sessionStorage clears on tab close, which is exactly
 * the session boundary this is meant to capture. */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Tags a page view with the job/course it's for, when the URL is a detail
 * page — this is what powers "most viewed job/course" in the dashboard.
 * Roadmaps have no per-item detail route (one listing page), so only the
 * page itself is tagged, not an individual roadmap. */
function resourceFromPath(path: string): { resource_type?: string; resource_id?: string } {
  const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  const job = path.match(new RegExp(`^/jobs/(${uuid})`, 'i'));
  if (job) return { resource_type: 'job', resource_id: job[1] };
  const course = path.match(new RegExp(`^/courses/(${uuid})`, 'i'));
  if (course) return { resource_type: 'course', resource_id: course[1] };
  if (path === '/roadmaps') return { resource_type: 'roadmap' };
  return {};
}

/**
 * Fires a page-view analytics event on every route change — logged-in users
 * only. Anonymous visitors are intentionally not tracked here; GA4 (already
 * wired into app/layout.tsx) is the source of truth for anonymous traffic —
 * see ANALYTICS_DESIGN.md for why this app doesn't run two tracking systems.
 *
 * Fire-and-forget by design: a failed/slow analytics call must never block
 * navigation or surface an error to the visitor.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const { user } = useUser();

  useEffect(() => {
    if (!user || !pathname) return;
    const { resource_type, resource_id } = resourceFromPath(pathname);
    userApi
      .logAnalyticsEvent({ session_id: getSessionId(), event_type: 'page_view', path: pathname, resource_type, resource_id })
      .catch(() => {});
  }, [pathname, user]);

  return null;
}

/** Exported so ChatBot.tsx can tag Rev-widget usage with the same session id. */
export { getSessionId };
