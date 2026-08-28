const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/v1`;

/**
 * Public file upload (checkout flow — see SERVICES_ARCHITECTURE.md). Not
 * routed through req<T>/userReq: this is multipart/form-data, so the browser
 * must set its own Content-Type with a boundary — setting it manually breaks
 * the request. No credentials/auth here either, matching order creation's
 * own public+throttled model (checkout has no persistent login session).
 */
export async function uploadFile(file: File): Promise<{ id: string; fileName: string; mimeType: string; size: number; url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE}/uploads`, { method: 'POST', body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Upload failed');
  }
  return res.json();
}

// CSRF token is returned in the login/refresh response body (not readable from cookie
// when frontend and API are on different domains). Stored in localStorage so it
// survives page refreshes.
//
// Admin session and user session use separate CSRF tokens because they map to
// different cookies (`csrf_token` vs `csrf_user_token`). The two sessions can
// coexist in one browser.
let _csrfToken = typeof window !== 'undefined' ? (localStorage.getItem('csrf_token') ?? '') : '';
let _userCsrfToken = typeof window !== 'undefined' ? (localStorage.getItem('csrf_user_token') ?? '') : '';

export function storeCsrfToken(token: string) {
  _csrfToken = token;
  if (typeof window !== 'undefined') localStorage.setItem('csrf_token', token);
}
export function storeUserCsrfToken(token: string) {
  _userCsrfToken = token;
  if (typeof window !== 'undefined') localStorage.setItem('csrf_user_token', token);
}
export function clearUserCsrfToken() {
  _userCsrfToken = '';
  if (typeof window !== 'undefined') localStorage.removeItem('csrf_user_token');
}

function getCsrfToken(): string { return _csrfToken; }
function getUserCsrfToken(): string { return _userCsrfToken; }

// Every admin page calls this directly (rather than the api.* / req<T>
// wrapper below), so — unlike req<T> — it had no silent-refresh-on-401
// logic: once an admin's short-lived access token expired mid-session, every
// authFetch call started returning a bare 401 with no recovery, which pages
// then fed straight into `.json()` and `setState()` without checking
// `res.ok` — e.g. `items.map is not a function` when the "array" was
// actually `{statusCode:401,...}`. Mirrors req<T>'s refresh-and-retry here
// so the fix applies to all 11 admin pages that use authFetch at once.
export async function authFetch(url: string, opts?: RequestInit, isRetry = false): Promise<Response> {
  const isWrite = opts?.method && ['POST', 'PATCH', 'DELETE', 'PUT'].includes(opts.method);
  const res = await fetch(url, {
    ...opts,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(isWrite ? { 'X-CSRF-Token': getCsrfToken() } : {}),
      ...(opts?.headers || {}),
    },
  });

  if (res.status === 401 && !isRetry) {
    const refreshRes = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': getCsrfToken() },
    }).catch(() => null);
    if (refreshRes?.ok) {
      const refreshData = await refreshRes.json().catch(() => ({}));
      if (refreshData?.csrfToken) storeCsrfToken(refreshData.csrfToken);
      return authFetch(url, opts, true);
    }
    // Refresh failed too — the session is genuinely over, same as req<T>.
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tch_auth');
      window.location.href = '/login';
    }
  }

  // Same as req<T> below — public pages listen on this via useAdminSync() to
  // refetch live instead of requiring a manual reload. authFetch-based admin
  // pages (testimonials, jobs, orders, etc.) never fired this, so an admin
  // toggling something published/hidden never reached anyone already on the
  // public page.
  if (typeof window !== 'undefined' && isWrite && res.ok) {
    new BroadcastChannel('admin-update').postMessage('refresh');
  }

  return res;
}

async function req<T>(path: string, opts?: RequestInit, isRetry = false): Promise<T> {
  const isWrite = opts?.method && ['POST', 'PATCH', 'DELETE'].includes(opts.method);
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(isWrite ? { 'X-CSRF-Token': getCsrfToken() } : {}),
      ...(opts?.headers || {}),
    },
    cache: 'no-store',
  });

  if (res.status === 401 && !isRetry) {
    // Access token expired — try to refresh silently
    const refreshRes = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': getCsrfToken() },
    });
    if (refreshRes.ok) {
      const refreshData = await refreshRes.json().catch(() => ({}));
      if (refreshData?.csrfToken) storeCsrfToken(refreshData.csrfToken);
      return req<T>(path, opts, true);
    }
    // Refresh failed — session is over
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tch_auth');
      window.location.href = '/login';
    }
    throw new Error('Session expired');
  }

  if (!res.ok) throw new Error(`API error ${res.status}`);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (typeof window !== 'undefined' && isWrite) {
    new BroadcastChannel('admin-update').postMessage('refresh');
  }
  return data;
}

export const api = {
  jobs: {
    list: (page = 1, limit = 200) => req<any[]>(`/jobs?page=${page}&limit=${limit}`),
    listPublished: (page = 1, limit = 200) => req<any[]>(`/jobs/published?page=${page}&limit=${limit}`),
    get: (id: string) => req<any>(`/jobs/${id}`),
    create: (data: any) => req<any>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/jobs/${id}`, { method: 'DELETE' }),
    fetchExternal: (data: { keywords: string; location: string; pages: number }) =>
      req<{ imported: number; skipped: number }>('/jobs/fetch-external', { method: 'POST', body: JSON.stringify(data) }),
  },
  courses: {
    list: (page = 1, limit = 200) => req<any[]>(`/courses?page=${page}&limit=${limit}`),
    listPublished: (page = 1, limit = 200) => req<any[]>(`/courses/published?page=${page}&limit=${limit}`),
    get: (id: string) => req<any>(`/courses/${id}`),
    create: (data: any) => req<any>('/courses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/courses/${id}`, { method: 'DELETE' }),
  },
  blogs: {
    list: (page = 1, limit = 200) => req<any[]>(`/blogs?page=${page}&limit=${limit}`),
    listPublished: () => req<any[]>('/blogs/published'),
    get: (id: string) => req<any>(`/blogs/${id}`),
    create: (data: any) => req<any>('/blogs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/blogs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/blogs/${id}`, { method: 'DELETE' }),
  },
  services: {
    // Admin — returns all (including unpublished) with pagination envelope { data, total, page, limit }
    list: (page = 1, limit = 200) =>
      req<any>(`/services?page=${page}&limit=${limit}`).then((r: any) => Array.isArray(r) ? r : (r?.data ?? [])),
    // Public — only published services, sorted popular-first
    listPublished: (page = 1, limit = 200) =>
      req<any>(`/services/published?page=${page}&limit=${limit}`).then((r: any) => Array.isArray(r) ? r : (r?.data ?? [])),
    // Public — only popular+published services
    listPopular: () => req<any[]>('/services/popular'),
    get: (id: string) => req<any>(`/services/${id}`),
    create: (data: any) => req<any>('/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/services/${id}`, { method: 'DELETE' }),
  },
  orders: {
    list: (page = 1, limit = 200) => req<any[]>(`/orders?page=${page}&limit=${limit}`),
    get: (id: string) => req<any>(`/orders/${id}`),
    details: (id: string) => req<any>(`/orders/${id}/details`),
    create: (data: any) => req<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/orders/${id}`, { method: 'DELETE' }),
  },
  roadmaps: {
    list: (page = 1, limit = 200) => req<any[]>(`/roadmaps?page=${page}&limit=${limit}`),
    get: (id: string) => req<any>(`/roadmaps/${id}`),
    create: (data: any) => req<any>('/roadmaps', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/roadmaps/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/roadmaps/${id}`, { method: 'DELETE' }),
  },
  settings: {
    list: () => req<any[]>('/settings'),
    getMap: () => req<Record<string, string>>('/settings/map'),
    upsert: (data: { key: string; value: string; label?: string; description?: string }) =>
      req<any>('/settings', { method: 'POST', body: JSON.stringify(data) }),
    updateMany: (updates: { key: string; value: string }[]) =>
      req<any[]>('/settings/bulk', { method: 'POST', body: JSON.stringify(updates) }),
  },
  testimonials: {
    list: (page = 1, limit = 200) => req<any[]>(`/testimonials?page=${page}&limit=${limit}`),
    listPublished: () => req<any[]>('/testimonials/published'),
    get: (id: string) => req<any>(`/testimonials/${id}`),
    create: (data: any) => req<any>('/testimonials', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/testimonials/${id}`, { method: 'DELETE' }),
  },
  analytics: {
    overview: (qs: string) => req<any>(`/analytics/overview?${qs}`),
    usersOverTime: (qs: string) => req<any[]>(`/analytics/users-over-time?${qs}`),
    signupsOverTime: (qs: string) => req<any[]>(`/analytics/signups-over-time?${qs}`),
    sessionsOverTime: (qs: string) => req<any[]>(`/analytics/sessions-over-time?${qs}`),
    activityByHour: (qs: string) => req<any[]>(`/analytics/activity-by-hour?${qs}`),
    activityByDayOfWeek: (qs: string) => req<any[]>(`/analytics/activity-by-day-of-week?${qs}`),
    retention: (qs: string) => req<any>(`/analytics/retention?${qs}`),
    revbot: (qs: string) => req<any>(`/analytics/revbot?${qs}`),
    contentEngagement: (qs: string) => req<any>(`/analytics/content-engagement?${qs}`),
    usersTable: (qs: string) => req<any>(`/analytics/users-table?${qs}`),
    trafficOverview: (qs: string) => req<any>(`/analytics/traffic/overview?${qs}`),
    trafficByDay: (qs: string) => req<any>(`/analytics/traffic/by-day?${qs}`),
    trafficByHour: (qs: string) => req<any>(`/analytics/traffic/by-hour?${qs}`),
    trafficByDayOfWeek: (qs: string) => req<any>(`/analytics/traffic/by-day-of-week?${qs}`),
  },
  subscribers: {
    list: (page = 1, limit = 200) => req<any[]>(`/subscribers?page=${page}&limit=${limit}`),
    create: (data: any) => req<any>('/subscribers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/subscribers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/subscribers/${id}`, { method: 'DELETE' }),
  },
  interviewQuestions: {
    list: (page = 1, limit = 200) => req<any[]>(`/interview-questions?page=${page}&limit=${limit}`),
    listPublished: () => req<any[]>('/interview-questions/published'),
    get: (id: string) => req<any>(`/interview-questions/${id}`),
    create: (data: any) => req<any>('/interview-questions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/interview-questions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/interview-questions/${id}`, { method: 'DELETE' }),
  },
  salaryInsights: {
    list: (page = 1, limit = 200) => req<any[]>(`/salary-insights?page=${page}&limit=${limit}`),
    create: (data: any) => req<any>('/salary-insights', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/salary-insights/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/salary-insights/${id}`, { method: 'DELETE' }),
  },
  dailyTips: {
    list: (page = 1, limit = 200) => req<any[]>(`/daily-tips?page=${page}&limit=${limit}`),
    random: () => req<any>('/daily-tips/random'),
    create: (data: any) => req<any>('/daily-tips', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/daily-tips/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/daily-tips/${id}`, { method: 'DELETE' }),
  },
  successStories: {
    list: (page = 1, limit = 200) => req<any[]>(`/success-stories?page=${page}&limit=${limit}`),
    listPublished: () => req<any[]>('/success-stories/published'),
    create: (data: any) => req<any>('/success-stories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/success-stories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/success-stories/${id}`, { method: 'DELETE' }),
  },
  community: {
    list: (page = 1, limit = 200) => req<any[]>(`/community?page=${page}&limit=${limit}`),
    listPublished: () => req<any[]>('/community/published'),
    create: (data: any) => req<any>('/community', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/community/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/community/${id}`, { method: 'DELETE' }),
  },
  bookings: {
    list: (page = 1, limit = 200) => req<any[]>(`/bookings?page=${page}&limit=${limit}`),
    create: (data: any) => req<any>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/bookings/${id}`, { method: 'DELETE' }),
  },
  slots: {
    listAll: () => req<any[]>('/slots'),
    listAvailable: () => req<any[]>('/slots/available'),
    create: (data: any) => req<any>('/slots', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/slots/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => req<any>(`/slots/${id}`, { method: 'DELETE' }),
    toggle: (id: string) => req<any>(`/slots/${id}/toggle`, { method: 'PATCH' }),
    book: (id: string, data: { name: string; email: string; order_id?: string }) =>
      req<any>(`/slots/${id}/book`, { method: 'POST', body: JSON.stringify(data) }),
    unbook: (id: string) => req<any>(`/slots/${id}/unbook`, { method: 'POST' }),
  },
  auditLogs: {
    list: (page = 1, limit = 100) => req<any[]>(`/audit-logs?page=${page}&limit=${limit}`),
  },
  resumeTemplates: {
    list: (page = 1, limit = 200) => req<any[]>(`/resume-templates?page=${page}&limit=${limit}`),
    listPublished: () => req<any[]>('/resume-templates/published'),
    create: (data: any) => req<any>('/resume-templates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/resume-templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/resume-templates/${id}`, { method: 'DELETE' }),
  },
};

// ── End-user (SiteUser) types & client ──────────────────────────────────────
// Kept in a separate `userApi` namespace so admin and user surfaces stay
// architecturally distinct (and so each can use its own auto-refresh path).

export interface SiteUser {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  phone: string | null;
  experience: string | null;
  target_role: string | null;
  current_role: string | null;
  bio: string | null;
  avatar_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  xp: number;
  level: number;
  is_pro: boolean;
  pro_expires_at: string | null;
  email_opt_in: boolean;
  // Phase 3 — privacy + referral surface
  profile_public: boolean;
  referral_code: string | null;
  created_at: string;
  // Phase 2: engagement enrichment (present on /users/me responses)
  streak?: UserStreakInfo;
  recent_badges?: UserBadgeInfo[];
}

export interface UserStreakInfo {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  shields_remaining: number;
}

export interface UserBadgeInfo {
  id: string;
  code: string;
  name: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earned_at: string;
}

export interface DailyChallenge {
  date: string;
  xp_reward: number;
  question: {
    id: string;
    company: string;
    role: string;
    question: string;
    difficulty: string;
    category: string;
  } | null;
}

export interface ChallengeSubmissionResult {
  submission: { id: string; submitted_at: string };
  xp: { awarded: number; total_xp: number; leveled_up: boolean; new_level: number };
  streak: { current: number; longest: number; milestone_hit: number | null; milestone_xp: number };
  new_badges: { id: string; code: string; name: string; icon: string; tier: string }[];
}

export interface EngagementSummary {
  streak: {
    current_streak: number;
    longest_streak: number;
    last_activity_date: string | null;
    shields_remaining: number;
    active_today: boolean;
    at_risk: boolean;
    next_milestone: { days: number; xp: number } | null;
  };
  recent_badges: UserBadgeInfo[];
}

export interface EngagementDashboard {
  streak: EngagementSummary['streak'];
  recent_xp: { id: string; amount: number; reason: string; metadata: unknown; created_at: string }[];
  badges: {
    id: string; code: string; name: string; description: string;
    icon: string; tier: string;
    earned: boolean; earned_at: string | null;
  }[];
  earned_count: number;
  total_count: number;
}

// ── Phase 3 — viral types ───────────────────────────────────────────────────
export interface ResumeRoastResult {
  share_token: string;
  score: number;
  result: {
    score: number;
    verdict: 'savage' | 'salty' | 'spicy' | 'mid' | 'solid' | 'elite';
    roasts: string[];
    fixes: string[];
    one_liner: string;
  };
}

export interface PublicProfile {
  username: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  experience: string | null;
  current_role: string | null;
  target_role: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  level: number;
  level_name: string;
  xp: number;
  is_pro: boolean;
  member_since: string;
  streak: { current: number; longest: number };
  badges: {
    code: string; name: string; description: string;
    icon: string; tier: string; earned_at: string;
  }[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: { id: number; label: string }[];
}

export interface QuizResult {
  share_token: string;
  result_type: string;
  label: string;
  result_label?: string;
  blurb: string;
  traits: string[];
  roles: string[];
  emoji: string;
  site_user_id?: string | null;
  created_at?: string;
}

export interface PlacementResult {
  story_id: string;
  tagline: string;
  polished_story: string;
  status: 'pending_review';
  message: string;
}

export interface ReferralStats {
  referral_code: string | null;
  referred_count: number;
  xp_per_referral: number;
  total_xp_earned: number;
}

// ── Phase 4 — AI feature types ──────────────────────────────────────────────

export interface OptimizationResult {
  ats_score_before: number;
  ats_score_after: number;
  optimized_summary: string;
  rewrote_bullets: { original: string; optimized: string; keywords_added: string[] }[];
  missing_keywords: string[];
  added_keywords: string[];
  one_liner: string;
}

export interface AnswerEvaluation {
  overall_score: number;
  structure_score: number;
  clarity_score: number;
  technical_score: number;
  star_compliance: { situation: boolean; task: boolean; action: boolean; result: boolean };
  strengths: string[];
  improvements: string[];
  improved_version: string;
}

export interface MockInterviewSession {
  id: string;
  share_token: string;
  role: string;
  company: string | null;
  difficulty: string;
  first_question: string;
}

export interface MockInterviewScores {
  overall: number;
  technical: number;
  communication: number;
  summary: string;
  strengths: string[];
  improvements: string[];
}

export interface UsageDashboard {
  is_pro: boolean;
  features: {
    feature: string;
    used: number;
    limit: number | null;
    remaining: number | null;
    window_label: string;
  }[];
}

/**
 * Stream Server-Sent Events from a POST endpoint. We use POST (not EventSource)
 * because EventSource doesn't support custom CSRF headers or POST bodies.
 *
 * Each `data:` line is parsed as JSON and yielded. Caller closes the stream
 * by breaking out of the for-await loop or letting the response finish.
 */
export async function* streamSseFromPost(path: string, body: any): AsyncGenerator<any> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': _userCsrfToken,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    let msg = `Stream failed (${res.status})`;
    try { msg = JSON.parse(text)?.message || msg; } catch { /* default */ }
    const finalMsg = Array.isArray(msg) ? msg.join(', ') : msg;
    // Same 402 → upsell event pattern as the non-streaming path
    if (res.status === 402 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pro:required', {
        detail: { message: finalMsg, feature: inferFeatureFromPath(path) },
      }));
    }
    throw new Error(finalMsg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // SSE messages end in \n\n. Buffer until we have at least one complete one.
    let idx;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = raw.replace(/^data:\s*/, '').trim();
      if (!line) continue;
      try { yield JSON.parse(line); } catch { /* ignore malformed line */ }
    }
  }
}

/**
 * Parallel request helper that targets user endpoints.
 * Differences from `req`:
 *   - sends the user CSRF token (`csrf_user_token`) on writes
 *   - on 401, refreshes via `/users/refresh` (not `/auth/refresh`)
 *   - on refresh failure, clears user-side localStorage only — does NOT touch
 *     admin state and does NOT redirect (the caller decides what to render)
 */
async function userReq<T>(path: string, opts?: RequestInit, isRetry = false): Promise<T> {
  const isWrite = opts?.method && ['POST', 'PATCH', 'DELETE'].includes(opts.method);
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(isWrite ? { 'X-CSRF-Token': getUserCsrfToken() } : {}),
      ...(opts?.headers || {}),
    },
    cache: 'no-store',
  });

  if (res.status === 401 && !isRetry) {
    const refreshRes = await fetch(`${BASE}/users/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': getUserCsrfToken() },
    });
    if (refreshRes.ok) {
      const refreshData = await refreshRes.json().catch(() => ({}));
      if (refreshData?.csrfToken) storeUserCsrfToken(refreshData.csrfToken);
      return userReq<T>(path, opts, true);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tch_user');
      clearUserCsrfToken();
    }
    throw new Error('Session expired');
  }

  if (!res.ok) {
    // Surface backend error messages — UI needs them for "username taken", "invalid OTP", etc.
    const text = await res.text();
    let msg = `Request failed (${res.status})`;
    try { msg = JSON.parse(text)?.message || msg; } catch { /* keep default */ }
    const finalMsg = Array.isArray(msg) ? msg.join(', ') : msg;

    // Phase 5 — HTTP 402 = Pro upgrade required. Throw a tagged error so a
    // global listener can intercept and surface the upsell modal instead of
    // each call site having to detect it.
    if (res.status === 402 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pro:required', {
        detail: { message: finalMsg, feature: inferFeatureFromPath(path) },
      }));
    }
    const err = new Error(finalMsg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : (null as T);
}

/** Map an API path back to a human-readable feature name for the upsell modal. */
function inferFeatureFromPath(path: string): string {
  if (path.startsWith('/optimizer'))      return 'Resume Optimizer';
  if (path.startsWith('/evaluator'))      return 'Answer Evaluator';
  if (path.startsWith('/mock-interview')) return 'Mock Interview';
  if (path.startsWith('/revbot'))         return 'Rev Career Coach';
  return 'this Pro feature';
}

export const userApi = {
  /** Step 0 (optional): does an account already exist for this email? Used by
   * AuthModal to route to OTP (existing) vs. the name-collection signup step
   * (new) before an OTP is sent. */
  checkEmail: (email: string) =>
    userReq<{ exists: boolean }>('/users/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /** In-app analytics event (page view / Rev widget usage). Logged-in users
   * only — fire-and-forget from the caller's side, never blocks navigation. */
  logAnalyticsEvent: (data: { session_id: string; event_type: string; path: string; resource_type?: string; resource_id?: string }) =>
    userReq<void>('/analytics/event', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Step 1: ask backend to send an OTP. Always returns the same opaque message
   * so the UI cannot leak whether the email already exists. */
  startAuth: (email: string) =>
    userReq<{ message: string }>('/users/start-auth', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /** Step 2: verify OTP, receive user + csrfToken. Caller MUST persist both. */
  verifyOtp: (data: { email: string; code: string; name?: string; ref_code?: string }) =>
    userReq<{ user: SiteUser; isNewUser: boolean; csrfToken: string }>('/users/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Fetch the authenticated user — used on page load to hydrate UserContext. */
  me: () => userReq<SiteUser>('/users/me'),

  updateProfile: (data: Partial<Pick<SiteUser,
    'name' | 'username' | 'phone' | 'experience' | 'target_role' | 'current_role' |
    'bio' | 'avatar_url' | 'github_url' | 'linkedin_url' | 'email_opt_in' | 'profile_public'
  >>) =>
    userReq<SiteUser>('/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  logout: () => userReq<{ success: boolean }>('/users/logout', { method: 'POST' }),

  deleteAccount: () => userReq<{ success: boolean }>('/users/me', { method: 'DELETE' }),

  // ── Phase 2: engagement ──────────────────────────────────────────────────
  /** Today's challenge — public, no auth. */
  todaysChallenge: () => userReq<DailyChallenge | null>('/challenges/today'),

  /** Returns null if user hasn't submitted today. */
  myTodaysSubmission: () =>
    userReq<{ id: string; answer: string; submitted_at: string } | null>('/challenges/today/my-submission'),

  submitChallenge: (date: string, answer: string) =>
    userReq<ChallengeSubmissionResult>(`/challenges/${date}/submit`, {
      method: 'POST',
      body: JSON.stringify({ date, answer }),
    }),

  /** Fast snapshot for navbar/header chips. */
  engagementSummary: () => userReq<EngagementSummary>('/engagement/me/summary'),

  /** Full dashboard for /account engagement panels. */
  engagementDashboard: () => userReq<EngagementDashboard>('/engagement/me/dashboard'),

  weeklyLeaderboard: (limit = 50) =>
    userReq<{ rank: number; user_id: string; name: string; username: string | null; level: number; weekly_xp: number }[]>(
      `/engagement/leaderboard/weekly?limit=${limit}`,
    ),

  // ── Phase 3: viral ──────────────────────────────────────────────────────
  /** Roast from pasted text. Works anonymous OR authenticated. */
  createRoastFromText: (resume_text: string) =>
    userReq<ResumeRoastResult>('/roasts', {
      method: 'POST',
      body: JSON.stringify({ resume_text }),
    }),

  /** Roast from PDF upload — multipart, so we use a raw fetch (userReq is JSON-only). */
  createRoastFromPdf: async (file: File): Promise<ResumeRoastResult> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${BASE}/roasts/pdf`, {
      method: 'POST',
      credentials: 'include',
      // No Content-Type — browser sets multipart/form-data with boundary
      body: fd,
    });
    if (!res.ok) {
      const text = await res.text();
      let msg = `Request failed (${res.status})`;
      try { msg = JSON.parse(text)?.message || msg; } catch { /* default */ }
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
    return res.json();
  },

  getRoast: (token: string) => userReq<{
    share_token: string; score: number; result: ResumeRoastResult['result']; created_at: string;
  }>(`/roasts/${token}`),

  // Public profiles
  getPublicProfile: (username: string) => userReq<PublicProfile>(`/users/public/${username}`),

  // Career quiz
  quizQuestions: () => userReq<{ questions: QuizQuestion[] }>('/quiz/questions'),
  submitQuiz: (answers: number[]) =>
    userReq<QuizResult>('/quiz/submit', { method: 'POST', body: JSON.stringify({ answers }) }),
  getQuizResult: (token: string) => userReq<QuizResult>(`/quiz/result/${token}`),

  // Placement story
  submitPlacement: (data: {
    name: string; before_role: string; after_role: string;
    company: string; salary_hike?: string; story: string;
  }) => userReq<PlacementResult>('/placements/submit', { method: 'POST', body: JSON.stringify(data) }),

  // Referrals
  myReferralStats: () => userReq<ReferralStats>('/referrals/me'),
  lookupReferralCode: (code: string) =>
    userReq<{ valid: boolean; referrer?: { name: string | null; username: string | null } }>(`/referrals/lookup/${code}`),

  // ── Phase 4: AI features ──────────────────────────────────────────────
  // Resume Optimizer
  optimizeResume: (resume_text: string, jd_text: string) =>
    userReq<{ share_token: string; result: OptimizationResult }>('/optimizer', {
      method: 'POST',
      body: JSON.stringify({ resume_text, jd_text }),
    }),
  getOptimization: (token: string) =>
    userReq<{
      share_token: string;
      result: OptimizationResult;
      created_at: string;
      original_text?: string;
      jd_text?: string;
    }>(`/optimizer/${token}`),

  // Answer Evaluator
  evaluateAnswer: (data: { question_id?: string; question_text: string; answer: string }) =>
    userReq<AnswerEvaluation>('/evaluator/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Mock Interview
  startMockInterview: (data: { role: string; company?: string; difficulty?: 'easy' | 'medium' | 'hard' }) =>
    userReq<MockInterviewSession>('/mock-interview/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  /** Streams text deltas in real time. Caller iterates via for-await. */
  streamMockInterviewMessage: (interviewId: string, message: string) =>
    streamSseFromPost(`/mock-interview/${interviewId}/message`, { message }),
  completeMockInterview: (interviewId: string) =>
    userReq<{ share_token: string; scores: MockInterviewScores; transcript: any }>(
      `/mock-interview/${interviewId}/complete`,
      { method: 'POST' },
    ),
  getMockInterviewByToken: (token: string) =>
    userReq<{
      share_token: string;
      role: string;
      company: string | null;
      difficulty: string;
      scores: MockInterviewScores;
      transcript: { role: 'user' | 'assistant'; content: string; ts: string }[];
      completed_at: string;
    }>(`/mock-interview/share/${token}`),

  // RevBot — same SSE pattern as mock interview
  streamRevBotChat: (messages: { role: 'user' | 'assistant'; content: string }[]) =>
    streamSseFromPost('/revbot/chat', { messages }),

  // Usage dashboard
  myAiUsage: () => userReq<UsageDashboard>('/usage/me'),

  // ── Phase 5: subscriptions ───────────────────────────────────────────────
  /** All active plans for /pricing page — no auth needed. */
  listPlans: () => userReq<Plan[]>('/subscriptions/plans'),

  /** Current user's active subscription (null if free tier). */
  myCurrentSubscription: () => userReq<Subscription | null>('/subscriptions/me'),

  /** Past payment events for billing history panel. */
  myPaymentHistory: () => userReq<PaymentEventRow[]>('/subscriptions/me/history'),

  /** Step 1 of checkout: create the Razorpay subscription. */
  startCheckout: (plan_id: string) =>
    userReq<{ razorpay_subscription_id: string; razorpay_key_id: string; plan: { name: string; price_inr: number; period: string } }>(
      '/subscriptions/checkout',
      { method: 'POST', body: JSON.stringify({ plan_id }) },
    ),

  /** Step 2 of checkout: verify Razorpay signature → activate Pro. */
  verifyCheckout: (data: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) =>
    userReq<{ success: boolean; message: string }>(
      '/subscriptions/verify',
      { method: 'POST', body: JSON.stringify(data) },
    ),

  /** User-initiated cancel. Pro stays active until end of billing period. */
  cancelSubscription: () =>
    userReq<{ success: boolean; message: string }>(
      '/subscriptions/cancel',
      { method: 'POST' },
    ),

  // ── Phase 6: retention + community ──────────────────────────────────────

  // Notifications
  listNotifications: (limit = 50) => userReq<NotificationRow[]>(`/notifications?limit=${limit}`),
  unreadNotificationCount: () => userReq<{ count: number }>('/notifications/unread-count'),
  markNotificationRead: (id: string) =>
    userReq<{ count: number }>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () =>
    userReq<{ count: number }>('/notifications/mark-all-read', { method: 'POST' }),

  // Saved jobs
  listSavedJobs: () => userReq<SavedJobRow[]>('/saved-jobs'),
  saveJob: (jobId: string, notes?: string) =>
    userReq<SavedJobRow>(`/saved-jobs/${jobId}`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  unsaveJob: (jobId: string) =>
    userReq<{ removed: number }>(`/saved-jobs/${jobId}`, { method: 'DELETE' }),

  // Job applications (Kanban)
  listApplications: () => userReq<KanbanBoard>('/applications'),
  createApplication: (data: {
    job_id?: string; company: string; role: string;
    job_link?: string; status?: ApplicationStatus; notes?: string;
    applied_at?: string; next_follow_up?: string;
  }) => userReq<ApplicationRow>('/applications', { method: 'POST', body: JSON.stringify(data) }),
  updateApplication: (id: string, data: {
    status?: ApplicationStatus; notes?: string;
    applied_at?: string | null; next_follow_up?: string | null; offered_salary?: string;
  }) => userReq<ApplicationRow>(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteApplication: (id: string) =>
    userReq<{ id: string }>(`/applications/${id}`, { method: 'DELETE' }),

  // Community user-facing actions
  getCommunityDetail: (id: string) =>
    userReq<CommunityQuestionDetail>(`/community/x/questions/${id}`),
  askCommunityQuestion: (data: { title: string; question: string; tags?: string }) =>
    userReq<{ id: string }>('/community/x/questions', { method: 'POST', body: JSON.stringify(data) }),
  voteCommunityQuestion: (id: string) =>
    userReq<{ voted: boolean; votes_count: number }>(`/community/x/questions/${id}/vote`, { method: 'POST' }),
  bookmarkCommunityQuestion: (id: string) =>
    userReq<{ bookmarked: boolean }>(`/community/x/questions/${id}/bookmark`, { method: 'POST' }),
  postCommunityAnswer: (questionId: string, content: string) =>
    userReq<CommunityAnswerRow>(`/community/x/questions/${questionId}/answers`, {
      method: 'POST', body: JSON.stringify({ content }),
    }),
  voteCommunityAnswer: (answerId: string) =>
    userReq<{ voted: boolean; votes_count: number }>(`/community/x/answers/${answerId}/vote`, { method: 'POST' }),
  acceptCommunityAnswer: (answerId: string) =>
    userReq<{ accepted: boolean }>(`/community/x/answers/${answerId}/accept`, { method: 'POST' }),
  deleteCommunityAnswer: (answerId: string) =>
    userReq<{ deleted: boolean }>(`/community/x/answers/${answerId}`, { method: 'DELETE' }),

  // Activity feed
  publicActivityFeed: (limit = 30) =>
    userReq<ActivityEventRow[]>(`/activity/public?limit=${limit}`),

  // Dashboard
  getDashboard: () => userReq<DashboardData>('/dashboard/me'),

  // ── Phase 7: Web Push ────────────────────────────────────────────────────
  /** Public — anyone can read; SW needs this before it can subscribe. */
  pushVapidPublicKey: () =>
    userReq<{ key: string | null; enabled: boolean }>('/push/vapid-public-key'),

  pushSubscribe: (sub: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    userReq<{ id: string }>('/push/subscribe', { method: 'POST', body: JSON.stringify(sub) }),

  pushUnsubscribe: (endpoint: string) =>
    userReq<{ count: number }>('/push/subscribe', { method: 'DELETE', body: JSON.stringify({ endpoint }) }),
};

// ── Phase 5 — subscription types ────────────────────────────────────────────
export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_inr: number;        // in paise
  period: 'monthly' | 'yearly';
  interval: number;
  features: string[];
  active: boolean;
  sort_order: number;
}

export interface Subscription {
  id: string;
  site_user_id: string;
  plan_id: string;
  razorpay_subscription_id: string;
  status: 'created' | 'authenticated' | 'active' | 'pending' | 'halted' | 'cancelled' | 'completed' | 'expired';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  activated_at: string | null;
  charges_count: number;
  total_paid_paise: number;
  plan: Plan;
}

export interface PaymentEventRow {
  id: string;
  razorpay_payment_id: string | null;
  event_type: string;
  amount_paid_paise: number | null;
  created_at: string;
}

// ── Phase 6 — Retention & Community types ──────────────────────────────────
export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link_url: string | null;
  icon: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface SavedJobRow {
  id: string;
  notes: string | null;
  saved_at: string;
  job: {
    id: string; title: string; company: string;
    location: string; salary: string | null;
  };
}

export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface ApplicationRow {
  id: string;
  job_id: string | null;
  company: string;
  role: string;
  job_link: string | null;
  status: ApplicationStatus;
  notes: string | null;
  applied_at: string | null;
  next_follow_up: string | null;
  offered_salary: string | null;
  updated_at: string;
}

export interface KanbanBoard {
  board: Record<ApplicationStatus, ApplicationRow[]>;
  total: number;
}

export interface CommunityAnswerRow {
  id: string;
  content: string;
  accepted: boolean;
  votes_count: number;
  created_at: string;
  viewer_voted: boolean;
  user: { username: string | null; name: string | null; level: number; is_pro: boolean };
}

export interface CommunityQuestionDetail {
  id: string;
  title: string;
  question: string;
  tags: string | null;
  author_name: string;
  votes_count: number;
  answers_count: number;
  solved: boolean;
  created_at: string;
  answer: string | null;
  answered_by: string | null;
  user: { username: string | null; name: string | null; level: number } | null;
  answers: CommunityAnswerRow[];
  viewer: { is_author: boolean; voted: boolean; bookmarked: boolean };
}

export interface ActivityEventRow {
  id: string;
  type: string;
  metadata: Record<string, any>;
  created_at: string;
  user?: { username: string | null; name: string | null; level: number; is_pro: boolean };
}

export interface DashboardData {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    is_pro: boolean;
    xp: number;
    level: number;
    level_name: string;
    progress: {
      level: number; name: string;
      current_threshold: number; next_threshold: number;
      xp_into_level: number; xp_to_next: number; is_max_level: boolean;
    };
  };
  streak: {
    current_streak: number; longest_streak: number;
    last_activity_date: string | null; shields_remaining: number;
  };
  counters: {
    unread_notifications: number;
    saved_jobs: number;
    active_applications: number;
    upcoming_follow_ups: number;
    weekly_xp: number;
  };
  saved_jobs: SavedJobRow[];
  active_applications: { id: string; company: string; role: string; status: string; applied_at: string | null; next_follow_up: string | null }[];
  upcoming_follow_ups: { id: string; company: string; role: string; next_follow_up: string }[];
  recent_badges: { earned_at: string; badge: { code: string; name: string; icon: string; tier: string } }[];
  my_recent_activity: ActivityEventRow[];
  public_activity: ActivityEventRow[];
  unsolved_questions: { id: string; title: string; tags: string | null; answers_count: number; votes_count: number; created_at: string }[];
}

// ── Level helpers (client-side mirror of engagement.constants.ts) ───────────
// Duplicated intentionally — frontend would otherwise need the backend running
// to compute level chips. Single line of constants kept in sync manually.
export const LEVEL_THRESHOLDS = [0, 100, 500, 1500, 3500, 7000, 15000, 30000];
export const LEVEL_NAMES = [
  'Rookie', 'Intern', 'Junior Dev', 'Mid-Level',
  'Senior Dev', 'Staff Engineer', 'Principal', 'Tech Architect',
];

export function levelProgress(xp: number) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = LEVEL_THRESHOLDS[level] ?? current;
  const isMax = level >= LEVEL_THRESHOLDS.length;
  return {
    level,
    name: LEVEL_NAMES[level - 1],
    current_threshold: current,
    next_threshold: next,
    xp_into_level: xp - current,
    xp_to_next: isMax ? 0 : Math.max(0, next - xp),
    progress_pct: isMax ? 100 : Math.min(100, Math.round(((xp - current) / Math.max(1, next - current)) * 100)),
    is_max_level: isMax,
  };
}
