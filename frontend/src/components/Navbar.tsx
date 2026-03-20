'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, Zap, ChevronRight, ChevronDown } from 'lucide-react';
import GetInTouchBtn from './GetInTouchBtn';

const NAV_LINKS = [
  { href: '/',          label: 'Home'      },
  { href: '/jobs',      label: 'Jobs'      },
  { href: '/courses',   label: 'Courses'   },
  { href: '/roadmaps',  label: 'Roadmaps'  },
  { href: '/services',  label: 'Services'  },
  { href: '/community', label: 'Community' },
];

const MORE_LINKS = [
  { href: '/success-stories', label: 'Success Stories' },
  { href: '/mock-interview',  label: 'Mock Interview'  },
];

export default function Navbar() {
  const path = usePathname();
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen]     = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); setMoreOpen(false); }, [path]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const active = (href: string) =>
    href === '/' ? path === '/' : path === href || path.startsWith(href + '/');

  const moreActive = MORE_LINKS.some(l => active(l.href));

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '1px solid #e2e8f0' : '1px solid rgba(226,232,240,0.6)',
          transition: 'background .3s, border-color .3s, box-shadow .3s',
          boxShadow: scrolled ? '0 1px 24px rgba(15,23,42,.06)' : 'none',
        }}
      >
        <nav style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={17} style={{ color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', color: '#0f172a' }}>
              Tech<span style={{ color: '#2563eb' }}>Career</span>Hub
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                  color: active(href) ? '#2563eb' : '#64748b',
                  background: active(href) ? '#eff6ff' : 'transparent',
                  transition: 'color .15s, background .15s',
                }}
              >
                {label}
              </Link>
            ))}

            {/* More dropdown */}
            <div ref={moreRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMoreOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '7px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  color: moreActive ? '#2563eb' : '#64748b',
                  background: moreActive ? '#eff6ff' : 'transparent',
                  transition: 'color .15s, background .15s',
                }}
              >
                More <ChevronDown size={13} style={{ transition: 'transform .2s', transform: moreOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {moreOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(15,23,42,.1)', padding: 6,
                  minWidth: 200, zIndex: 60,
                }}>
                  {MORE_LINKS.map(({ href, label }) => (
                    <Link key={href} href={href}
                      style={{
                        display: 'block', padding: '8px 12px', borderRadius: 8,
                        fontSize: 13, fontWeight: 500, textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        color: active(href) ? '#2563eb' : '#475569',
                        background: active(href) ? '#eff6ff' : 'transparent',
                      }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} className="hidden-mobile">
            <GetInTouchBtn />
          </div>

          {/* Mobile hamburger */}
          <button
            style={{ display: 'none', padding: 8, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
            className="show-mobile"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileOpen(false)} />
          <div className="mobile-menu-panel" style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 272, display: 'flex', flexDirection: 'column', background: '#fff', boxShadow: '-4px 0 32px rgba(0,0,0,.12)' }}>
            <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Menu</span>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
              {[...NAV_LINKS, ...MORE_LINKS].map(({ href, label }) => (
                <Link key={href} href={href}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 14px', borderRadius: 9, fontSize: 14, fontWeight: 500,
                    textDecoration: 'none',
                    color: active(href) ? '#2563eb' : '#64748b',
                    background: active(href) ? '#eff6ff' : 'transparent',
                  }}
                >
                  {label} {active(href) && <ChevronRight size={14} />}
                </Link>
              ))}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #f1f5f9' }}>
              <GetInTouchBtn />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
      `}</style>
    </>
  );
}
