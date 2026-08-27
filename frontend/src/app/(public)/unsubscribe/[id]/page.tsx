'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, BellOff } from 'lucide-react';

const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/v1`;

export default function UnsubscribePage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const [status, setStatus] = useState<'working' | 'done'>('working');

  useEffect(() => {
    if (!id) return;
    // Deliberately doesn't surface an error state — the backend responds
    // the same way whether the id is valid or not (see subscribers.service),
    // so from the visitor's side this always ends in "you're unsubscribed."
    fetch(`${BASE}/subscribers/unsubscribe/${id}`, { method: 'POST' })
      .catch(() => undefined)
      .finally(() => setStatus('done'));
  }, [id]);

  return (
    <section style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 24px 60px' }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', padding: 36, textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, margin: '0 auto 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: status === 'working' ? '#f8fafc' : '#f0fdf4',
        }}>
          {status === 'working'
            ? <Loader2 size={22} className="spin" style={{ color: '#94a3b8' }} />
            : <CheckCircle2 size={22} style={{ color: '#16a34a' }} />}
        </div>

        {status === 'working' ? (
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Unsubscribing…</p>
        ) : (
          <>
            <h1 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>You're unsubscribed</h1>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
              You won't get any more newsletter emails from us. Changed your mind? You can subscribe again anytime from the homepage.
            </p>
            <Link href="/" className="btn btn-blue" style={{ gap: 6, display: 'inline-flex', alignItems: 'center' }}>
              <BellOff size={14} /> Back to homepage
            </Link>
          </>
        )}
      </div>

      <style>{`
        @keyframes _spin { to { transform: rotate(360deg); } }
        .spin { animation: _spin 1s linear infinite; }
      `}</style>
    </section>
  );
}
