import Link from 'next/link';

const cols = [
  { title: 'Platform', links: [{ l: 'Browse Jobs', h: '/jobs' }, { l: 'Courses', h: '/courses' }, { l: 'Roadmaps', h: '/roadmaps' }] },
  { title: 'Services', links: [{ l: 'Resume Writing', h: '/services' }, { l: 'ATS Optimization', h: '/services' }, { l: 'Book a Session', h: '/order' }] },
  { title: 'Company',  links: [{ l: 'About', h: '#' }, { l: 'Blog', h: '#' }, { l: 'Contact', h: '#' }] },
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
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>Helping developers and students launch their tech careers.</p>
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
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy', 'Terms', 'Cookies'].map(t => (
              <a key={t} href="#" style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'none' }}>{t}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
