'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/lib/api';
import { Home, Briefcase, GraduationCap, ShoppingBag, LogOut, Zap, FileText, Star, Settings, ShieldCheck, MessageSquare, HelpCircle, DollarSign, Lightbulb, Trophy, Users, Calendar, Layout, Bell, Map, Clock, ScrollText, BarChart3 } from 'lucide-react';

const NAV = [
  { href: '/admin',                      label: 'Dashboard',        icon: Home          },
  { href: '/admin/analytics',            label: 'Analytics',        icon: BarChart3     },
  { href: '/admin/jobs',                 label: 'Jobs',             icon: Briefcase     },
  { href: '/admin/courses',              label: 'Courses',          icon: GraduationCap },
  { href: '/admin/blogs',                label: 'Blogs',            icon: FileText      },
  { href: '/admin/roadmaps',             label: 'Roadmaps',         icon: Map           },
  { href: '/admin/orders',               label: 'Orders',           icon: ShoppingBag   },
  { href: '/admin/availability',         label: 'Availability',     icon: Clock         },
  { href: '/admin/services',             label: 'Services',         icon: Star          },
  { href: '/admin/testimonials',         label: 'Testimonials',     icon: MessageSquare },
  { href: '/admin/interview-questions',  label: 'Interview Q&A',    icon: HelpCircle    },
  { href: '/admin/salary-insights',      label: 'Salary Insights',  icon: DollarSign    },
  { href: '/admin/daily-tips',           label: 'Daily Tips',       icon: Lightbulb     },
  { href: '/admin/success-stories',      label: 'Success Stories',  icon: Trophy        },
  { href: '/admin/community',            label: 'Community',        icon: Users         },
  { href: '/admin/bookings',             label: 'Bookings',         icon: Calendar      },
  { href: '/admin/templates',            label: 'Templates',        icon: Layout        },
  { href: '/admin/subscribers',          label: 'Subscribers',      icon: Bell          },
  { href: '/admin/settings',             label: 'Settings',         icon: Settings      },
  { href: '/admin/admins',               label: 'Admins',           icon: ShieldCheck   },
  { href: '/admin/audit-logs',           label: 'Audit Logs',       icon: ScrollText    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('tch_auth');
    if (!stored) { router.replace('/login'); return; }
    try {
      const auth = JSON.parse(stored);
      if (auth.role !== 'admin') { router.replace('/login'); return; }
      setAdminEmail(auth.email || '');
      setChecking(false);
    } catch {
      router.replace('/login');
    }
  }, [router]);

  if (checking) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      <aside style={{
        width: 220, background: '#fff', borderRight: '1px solid #e2e8f0',
        position: 'fixed', top: 0, left: 0, height: '100%',
        display: 'flex', flexDirection: 'column', zIndex: 40,
      }}>
        {/* Logo */}
        <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#2563eb,var(--brand-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={13} style={{ color: '#fff' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Admin Panel</span>
        </div>
        {/* Nav */}
        <nav style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', overflowX: 'hidden' }}>
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8,
                fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#64748b',
              }}
            >
              <Icon size={15} />{label}
            </Link>
          ))}
        </nav>
        {/* Footer */}
        <div style={{ padding: 12, borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {adminEmail && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', marginBottom: 4,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#2563eb,var(--brand-violet))', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
              }}>
                {adminEmail[0]?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Signed in as</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={adminEmail}>
                  {adminEmail}
                </p>
              </div>
            </div>
          )}
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}
          >
            <Zap size={14} /> View site
          </Link>
          <button
            onClick={async () => {
              localStorage.removeItem('tch_auth');
              const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
              await authFetch(`${base}/v1/auth/logout`, { method: 'POST' }).catch(() => {});
              router.push('/login');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, marginLeft: 220, padding: 32, paddingTop: 80, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
