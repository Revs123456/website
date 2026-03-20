const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  if (typeof window !== 'undefined' && opts?.method && ['POST', 'PATCH', 'DELETE'].includes(opts.method)) {
    new BroadcastChannel('admin-update').postMessage('refresh');
  }
  return data;
}

export const api = {
  jobs: {
    list: () => req<any[]>('/jobs'),
    get: (id: string) => req<any>(`/jobs/${id}`),
    create: (data: any) => req<any>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/jobs/${id}`, { method: 'DELETE' }),
  },
  courses: {
    list: () => req<any[]>('/courses'),
    get: (id: string) => req<any>(`/courses/${id}`),
    create: (data: any) => req<any>('/courses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/courses/${id}`, { method: 'DELETE' }),
  },
  blogs: {
    list: () => req<any[]>('/blogs'),
    get: (id: string) => req<any>(`/blogs/${id}`),
    create: (data: any) => req<any>('/blogs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/blogs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/blogs/${id}`, { method: 'DELETE' }),
  },
  services: {
    list: () => req<any[]>('/services'),
    get: (id: string) => req<any>(`/services/${id}`),
    create: (data: any) => req<any>('/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/services/${id}`, { method: 'DELETE' }),
  },
  orders: {
    list: () => req<any[]>('/orders'),
    get: (id: string) => req<any>(`/orders/${id}`),
    create: (data: any) => req<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/orders/${id}`, { method: 'DELETE' }),
  },
  roadmaps: {
    list: () => req<any[]>('/roadmaps'),
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
    list: () => req<any[]>('/testimonials'),
    listPublished: () => req<any[]>('/testimonials/published'),
    get: (id: string) => req<any>(`/testimonials/${id}`),
    create: (data: any) => req<any>('/testimonials', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/testimonials/${id}`, { method: 'DELETE' }),
  },
  subscribers: {
    list: () => req<any[]>('/subscribers'),
    create: (data: any) => req<any>('/subscribers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/subscribers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/subscribers/${id}`, { method: 'DELETE' }),
  },
  interviewQuestions: {
    list: () => req<any[]>('/interview-questions'),
    listPublished: () => req<any[]>('/interview-questions/published'),
    get: (id: string) => req<any>(`/interview-questions/${id}`),
    create: (data: any) => req<any>('/interview-questions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/interview-questions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/interview-questions/${id}`, { method: 'DELETE' }),
  },
  salaryInsights: {
    list: () => req<any[]>('/salary-insights'),
    create: (data: any) => req<any>('/salary-insights', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/salary-insights/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/salary-insights/${id}`, { method: 'DELETE' }),
  },
  dailyTips: {
    list: () => req<any[]>('/daily-tips'),
    random: () => req<any>('/daily-tips/random'),
    create: (data: any) => req<any>('/daily-tips', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/daily-tips/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/daily-tips/${id}`, { method: 'DELETE' }),
  },
  successStories: {
    list: () => req<any[]>('/success-stories'),
    listPublished: () => req<any[]>('/success-stories/published'),
    create: (data: any) => req<any>('/success-stories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/success-stories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/success-stories/${id}`, { method: 'DELETE' }),
  },
  community: {
    list: () => req<any[]>('/community'),
    listPublished: () => req<any[]>('/community/published'),
    create: (data: any) => req<any>('/community', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/community/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/community/${id}`, { method: 'DELETE' }),
  },
  bookings: {
    list: () => req<any[]>('/bookings'),
    create: (data: any) => req<any>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/bookings/${id}`, { method: 'DELETE' }),
  },
  resumeTemplates: {
    list: () => req<any[]>('/resume-templates'),
    listPublished: () => req<any[]>('/resume-templates/published'),
    create: (data: any) => req<any>('/resume-templates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/resume-templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/resume-templates/${id}`, { method: 'DELETE' }),
  },
};
