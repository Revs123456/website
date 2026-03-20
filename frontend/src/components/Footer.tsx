'use client';
import Link from 'next/link';

const cols = [
  { title: 'Platform', links: [{ l: 'Browse Jobs', h: '/jobs' }, { l: 'Courses', h: '/courses' }, { l: 'Roadmaps', h: '/roadmaps' }, { l: 'Blogs', h: '/blogs' }] },
  { title: 'Services', links: [{ l: 'Resume Writing', h: '/services' }, { l: 'ATS Optimization', h: '/services' }, { l: 'Book a Session', h: '/order' }] },
  { title: 'More',     links: [{ l: 'Success Stories', h: '/success-stories' }, { l: 'Community', h: '/community' }, { l: 'Interview Prep', h: '/interview-questions' }, { l: 'Daily Tips', h: '/daily-tips' }] },
];

const SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/techchampsByrev',
    color: '#E1306C',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/techchampsbyrev',
    color: '#0A66C2',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/Revs123456',
    color: '#0f172a',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@techchampsbyrev',
    color: '#FF0000',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    label: 'Twitter / X',
    href: 'https://x.com/techchampsbyrev',
    color: '#000000',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/919999999999',
    color: '#25D366',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer style={{ background: '#fff', borderTop: '1px solid #e2e8f0' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '56px 24px' }}>
        {/* Top grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 40, marginBottom: 48 }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, textDecoration: 'none' }}>
              <img src="/TC.png" alt="TechChampsByRev logo" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>TechChamps<span style={{ color: '#2563eb' }}>ByRev</span></span>
            </Link>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>Helping developers and students launch their tech careers.</p>

            {/* Social icons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SOCIALS.map(({ label, href, color, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    border: '1px solid #e2e8f0', background: '#f8fafc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#94a3b8', transition: 'color .15s, background .15s, border-color .15s',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.color = color;
                    (e.currentTarget as HTMLAnchorElement).style.background = '#fff';
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = color + '60';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8';
                    (e.currentTarget as HTMLAnchorElement).style.background = '#f8fafc';
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e2e8f0';
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav cols */}
          {cols.map(({ title, links }) => (
            <div key={title}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 16 }}>{title}</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map(({ l, h }) => (
                  <li key={l}>
                    <Link href={h} style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#f1f5f9', marginBottom: 24 }} />

        {/* Bottom bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>© {new Date().getFullYear()} TechChampsByRev. All rights reserved.</p>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>Made with ❤️ for developers & students in India</p>
        </div>
      </div>
    </footer>
  );
}
