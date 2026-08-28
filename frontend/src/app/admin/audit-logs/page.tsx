'use client';
import { useEffect, useState } from 'react';
import { ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminSkeleton from '@/components/AdminSkeleton';
import { api } from '@/lib/api';

const METHOD_STYLE: Record<string, React.CSSProperties> = {
  POST:   { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' },
  PATCH:  { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' },
  DELETE: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
};

const ACTION_WORD: Record<string, string> = { POST: 'Created', PATCH: 'Updated', PUT: 'Updated', DELETE: 'Deleted' };

// path segment (after /v1/) -> readable singular noun. Anything not listed
// falls back to a best-effort humanization of the segment itself.
const RESOURCE_NAME: Record<string, string> = {
  jobs: 'Job', courses: 'Course', blogs: 'Blog', roadmaps: 'Roadmap',
  orders: 'Order', slots: 'Slot', services: 'Service', testimonials: 'Testimonial',
  'interview-questions': 'Interview Question', 'salary-insights': 'Salary Insight',
  'daily-tips': 'Daily Tip', 'success-stories': 'Success Story', community: 'Community Question',
  bookings: 'Booking', 'resume-templates': 'Resume Template', subscribers: 'Subscriber',
  settings: 'Setting', admins: 'Admin', users: 'User',
};

function humanizeResource(path: string): string {
  const segment = path.split('/').filter(Boolean)[1] || '';
  if (RESOURCE_NAME[segment]) return RESOURCE_NAME[segment];
  const words = segment.replace(/-/g, ' ').trim();
  if (!words) return 'Item';
  const singular = words.endsWith('s') ? words.slice(0, -1) : words;
  return singular.replace(/\b\w/g, c => c.toUpperCase()) || 'Item';
}

function describeAction(method: string, path: string): string {
  return `${ACTION_WORD[method] || method} ${humanizeResource(path)}`;
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

const PAGE_SIZE = 50;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  async function load(p: number) {
    setLoading(true);
    try {
      const data = await api.auditLogs.list(p, PAGE_SIZE);
      setLogs(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(page); }, [page]);

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={15} style={{ color: '#2563eb' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Audit Logs</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>All admin write actions — create, update, delete.</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '16px 20px' }}><AdminSkeleton rows={8} /></div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No audit logs yet.</div>
        ) : (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                {['Timestamp', 'Admin', 'Action', 'Details'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 20px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any, i: number) => (
                <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td style={{ padding: '12px 20px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {fmt(log.created_at)}
                  </td>
                  <td style={{ padding: '12px 20px', fontWeight: 500, color: '#0f172a' }}>
                    {log.admin_email}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        flexShrink: 0,
                        ...(METHOD_STYLE[log.method] || { background: '#f1f5f9', color: '#64748b' }),
                      }}>
                        {log.method}
                      </span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        {describeAction(log.method, log.path)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    {log.label ? (
                      <span style={{ color: '#374151', fontWeight: 500 }}>{log.label}</span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>{log.path}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && (page > 1 || hasMore) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: page === 1 ? '#f8fafc' : '#fff', color: page === 1 ? '#cbd5e1' : '#374151', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13 }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: !hasMore ? '#f8fafc' : '#fff', color: !hasMore ? '#cbd5e1' : '#374151', cursor: !hasMore ? 'default' : 'pointer', fontSize: 13 }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
