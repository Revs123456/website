import Link from 'next/link';
import { Briefcase, GraduationCap, ShoppingBag, TrendingUp, DollarSign, ArrowUpRight, FileText, Star } from 'lucide-react';
import { api } from '@/lib/api';

const STATUS_BADGE: Record<string, string> = {
  Completed:     'badge-green',
  'In Progress': 'badge-blue',
  Pending:       'badge-amber',
  completed:     'badge-green',
  pending:       'badge-amber',
};

export default async function AdminPage() {
  let jobs: any[] = [], courses: any[] = [], blogs: any[] = [], orders: any[] = [], services: any[] = [];
  try { [jobs, courses, blogs, orders, services] = await Promise.all([
    api.jobs.list(), api.courses.list(), api.blogs.list(), api.orders.list(), api.services.list(),
  ]); } catch {}

  const stats = [
    { label: 'Total Jobs',     val: jobs.length,     icon: Briefcase,     color: '#2563eb', href: '/admin/jobs'     },
    { label: 'Active Courses', val: courses.length,  icon: GraduationCap, color: '#7c3aed', href: '/admin/courses'  },
    { label: 'Blog Articles',  val: blogs.length,    icon: FileText,      color: '#0891b2', href: '/admin/blogs'    },
    { label: 'Total Orders',   val: orders.length,   icon: ShoppingBag,   color: '#d97706', href: '/admin/orders'   },
    { label: 'Service Plans',  val: services.length, icon: Star,          color: '#059669', href: '/admin/services' },
  ];

  const recent = orders.slice(0, 8);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Overview of your platform activity.</p>
        </div>
        <Link href="/admin/jobs" className="btn btn-blue btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          + Add Job
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {stats.map(({ label, val, icon: Icon, color, href }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} style={{ color }} />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 6 }}>{val}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#059669' }}>
                <TrendingUp size={11} />Live from API
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontWeight: 700, color: '#0f172a' }}>Recent Orders</h3>
          <Link href="/admin/orders" style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, color: '#2563eb', textDecoration: 'none' }}>
            View all <ArrowUpRight size={11} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            No orders yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Customer', 'Service', 'Date', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((o: any, i: number) => (
                  <tr key={o.id || i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <p style={{ fontWeight: 600, color: '#0f172a' }}>{o.customer_name || o.name || '—'}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8' }}>{o.customer_email || o.email || ''}</p>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b' }}>
                      {o.service?.name || o.service_name || `Plan #${o.service_id}` || '—'}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#94a3b8' }}>
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className={`badge ${STATUS_BADGE[o.status] || 'badge-slate'}`}>
                        {o.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { l: 'Post a Job',       h: '/admin/jobs',     icon: Briefcase,     c: '#2563eb' },
          { l: 'Add Course',       h: '/admin/courses',  icon: GraduationCap, c: '#7c3aed' },
          { l: 'Write Blog',       h: '/admin/blogs',    icon: FileText,      c: '#0891b2' },
          { l: 'View All Orders',  h: '/admin/orders',   icon: ShoppingBag,   c: '#d97706' },
          { l: 'Manage Services',  h: '/admin/services', icon: Star,          c: '#059669' },
        ].map(({ l, h, icon: Icon, c }) => (
          <Link key={l} href={h} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} style={{ color: c }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1 }}>{l}</span>
            <ArrowUpRight size={14} style={{ color: '#cbd5e1' }} />
          </Link>
        ))}
      </div>
    </>
  );
}
