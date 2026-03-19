'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, Zap, ChevronRight, Sparkles } from 'lucide-react';

const links = [
  { href: '/',                label: 'Home'      },
  { href: '/jobs',            label: 'Jobs'      },
  { href: '/courses',         label: 'Courses'   },
  { href: '/roadmaps',        label: 'Roadmaps'  },
  { href: '/blogs',           label: 'Blog'      },
  { href: '/ats-checker',     label: 'ATS Check' },
];

export default function Navbar() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setOpen(false); }, [path]);

  const active = (href: string) => href === '/' ? path === '/' : path === href || path.startsWith(href + '/');

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(16px)',
          borderBottom: scrolled ? '1px solid #e2e8f0' : '1px solid transparent',
        }}>
        <nav style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={14} style={{ color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', color: '#0f172a' }}>
              Tech<span style={{ color: '#2563eb' }}>Career</span>Hub
            </span>
          </Link>

          {/* Desktop nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden-mobile">
            {links.map(({ href, label }) => (
              <Link key={href} href={href}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none',
                  color: active(href) ? '#0f172a' : '#64748b',
                  background: active(href) ? '#f1f5f9' : 'transparent',
                }}>
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hidden-mobile">
            <Link href="/services" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Sparkles size={13} />Services</Link>
          </div>

          {/* Mobile hamburger */}
          <button
            style={{ display: 'none', padding: 8, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
            className="show-mobile"
            onClick={() => setOpen(o => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </header>

      {/* Mobile menu */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 260, display: 'flex', flexDirection: 'column', background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,.1)' }}>
            <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Menu</span>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {links.map(({ href, label }) => (
                <Link key={href} href={href}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none', color: active(href) ? '#2563eb' : '#64748b', background: active(href) ? '#eff6ff' : 'transparent' }}>
                  {label} {active(href) && <ChevronRight size={14} />}
                </Link>
              ))}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #f1f5f9' }}>
              <Link href="/services" className="btn btn-blue" style={{ textAlign: 'center', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={13} />Services</Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}
