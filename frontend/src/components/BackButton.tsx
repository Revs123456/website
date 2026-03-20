'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        fontWeight: 500,
        color: '#64748b',
        background: '#f1f5f9',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '6px 12px',
        cursor: 'pointer',
        textDecoration: 'none',
        marginBottom: 20,
        transition: 'background .15s, color .15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.color = '#0f172a'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
    >
      <ArrowLeft size={14} /> Back
    </button>
  );
}
