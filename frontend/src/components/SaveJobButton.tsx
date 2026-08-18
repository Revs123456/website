'use client';
import { useState } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { userApi } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import AuthModal from './AuthModal';

/**
 * Drop-in save/unsave toggle for job cards.
 * Optimistic UI: flips icon immediately, rolls back on error.
 *
 * Anonymous users get the AuthModal — saving a job is a strong intent
 * signal so we treat the click as a soft signup CTA.
 */
export default function SaveJobButton({
  jobId,
  initiallySaved,
  size = 'md',
  onChange,
}: {
  jobId: string;
  initiallySaved?: boolean;
  size?: 'sm' | 'md';
  onChange?: (saved: boolean) => void;
}) {
  const { user } = useUser();
  const [saved, setSaved] = useState(!!initiallySaved);
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  async function toggle(e: React.MouseEvent) {
    // Stop bubbling so clicking the heart inside a job card link doesn't navigate
    e.preventDefault();
    e.stopPropagation();
    if (!user) { setAuthOpen(true); return; }
    setBusy(true);
    const next = !saved;
    setSaved(next);
    try {
      if (next) await userApi.saveJob(jobId);
      else      await userApi.unsaveJob(jobId);
      onChange?.(next);
    } catch {
      setSaved(!next);    // rollback
    } finally {
      setBusy(false);
    }
  }

  const iconSize = size === 'sm' ? 13 : 16;
  const pad = size === 'sm' ? '5px 7px' : '7px 9px';

  return (
    <>
      <button
        onClick={toggle}
        disabled={busy}
        title={saved ? 'Saved — click to remove' : 'Save this job'}
        aria-pressed={saved}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: pad, borderRadius: 8, cursor: 'pointer',
          background: saved ? '#eff6ff' : '#fff',
          border: `1px solid ${saved ? '#bfdbfe' : '#e2e8f0'}`,
          color: saved ? '#2563eb' : '#64748b',
          transition: 'all .15s',
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? <Loader2 size={iconSize} className="spin" />
          : saved ? <BookmarkCheck size={iconSize} />
          : <Bookmark size={iconSize} />}
        <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
      </button>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" />
    </>
  );
}
