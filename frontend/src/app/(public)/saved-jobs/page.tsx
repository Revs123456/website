'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bookmark, Loader2, MapPin, ArrowRight, ExternalLink, Briefcase, Plus } from 'lucide-react';
import { userApi, type SavedJobRow } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import SaveJobButton from '@/components/SaveJobButton';

export default function SavedJobsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [items, setItems] = useState<SavedJobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace('/'); return; }
    (async () => {
      try { setItems(await userApi.listSavedJobs()); }
      catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [user, userLoading, router]);

  // Optimistic removal when user clicks the heart inline
  const handleSaveChange = (jobId: string, saved: boolean) => {
    if (!saved) setItems(prev => prev.filter(s => s.job.id !== jobId));
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '96px 24px 60px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bookmark size={22} /> Saved jobs
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
          Jobs you bookmarked. Move them to your application tracker when you apply.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={24} className="spin" style={{ color: '#94a3b8' }} />
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Bookmark size={36} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <p style={{ color: '#0f172a', margin: '0 0 6px', fontWeight: 600 }}>No saved jobs yet</p>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 18px' }}>
            Tap the bookmark icon on any job to save it here.
          </p>
          <Link href="/jobs" className="btn btn-blue">
            Browse jobs <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(s => {
            const job = s.job;
            return (
              <div key={s.id} className="card" style={{ padding: 18, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                  background: '#eff6ff', color: '#2563eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14,
                }}>
                  {job.company?.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <Link href={`/jobs/${job.id}`} style={{ fontWeight: 700, color: '#0f172a', textDecoration: 'none', fontSize: 14 }}>
                    {job.title}
                  </Link>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#94a3b8', marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: '#475569' }}>{job.company}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} />{job.location}
                    </span>
                    {job.salary && <span style={{ fontWeight: 700, color: '#2563eb' }}>{job.salary}</span>}
                  </div>
                  {s.notes && (
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' }}>
                      &ldquo;{s.notes}&rdquo;
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                  <SaveJobButton
                    jobId={job.id}
                    initiallySaved={true}
                    onChange={(saved) => handleSaveChange(job.id, saved)}
                  />
                  <Link href={`/jobs/${job.id}`} className="btn btn-outline btn-sm">
                    View <ExternalLink size={11} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && items.length > 0 && (
        <div style={{ marginTop: 24, padding: 18, background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)', borderRadius: 12, border: '1px solid #bfdbfe', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Briefcase size={20} style={{ color: '#2563eb', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Ready to start applying?
            </p>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
              Track your applications across stages in the kanban board.
            </p>
          </div>
          <Link href="/applications" className="btn btn-blue btn-sm">
            <Plus size={13} /> Open tracker
          </Link>
        </div>
      )}

      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}
