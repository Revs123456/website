import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.04em', lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginTop: 16, marginBottom: 8 }}>Page not found</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, background: '#2563eb', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            ← Back to Home
          </Link>
          <Link href="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            Browse Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
