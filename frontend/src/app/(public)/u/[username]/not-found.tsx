import Link from 'next/link';

export default function ProfileNotFound() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '160px 24px 60px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>👤</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
        Profile not found
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 22px' }}>
        This profile doesn&apos;t exist, or the user hasn&apos;t made it public yet.
      </p>
      <Link href="/" className="btn btn-blue">
        Back to homepage
      </Link>
    </div>
  );
}
