'use client';
import { Trash2 } from 'lucide-react';

interface Props {
  title: string;
  name?: string;
  deleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteModal({ title, name, deleting, onConfirm, onCancel }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.5)', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 28, textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Trash2 size={20} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginBottom: 8 }}>{title}</h3>
        {name && (
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
            <strong style={{ color: '#0f172a' }}>{name}</strong> will be permanently removed.
          </p>
        )}
        {!name && (
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>This action cannot be undone.</p>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onCancel} className="btn btn-outline btn-sm" style={{ minWidth: 90 }}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{ minWidth: 90, padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#ef4444', color: '#fff', border: 'none', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
