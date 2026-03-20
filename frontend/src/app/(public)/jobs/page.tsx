'use client';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { useEffect, useState } from 'react';
import { Search, MapPin, Briefcase, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

const CAT_COLOR: Record<string, { c: string; bg: string }> = {
  Frontend:     { c: '#2563eb', bg: '#eff6ff' },
  Backend:      { c: '#7c3aed', bg: '#f5f3ff' },
  DevOps:       { c: '#0891b2', bg: '#ecfeff' },
  'Full-Stack': { c: '#059669', bg: '#ecfdf5' },
  'AI/ML':      { c: '#d97706', bg: '#fffbeb' },
};

const TYPE_BADGE: Record<string, string> = {
  'Full-time': 'badge-green',
  Contract:    'badge-amber',
  Internship:  'badge-violet',
};

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

function safeJson(s: string | null | undefined): any[] {
  try { return JSON.parse(s || '[]'); } catch { return []; }
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid #e2e8f0', borderTopColor: '#2563eb',
        animation: 'spin .8s linear infinite',
      }} />
    </div>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [loc, setLoc] = useState('All');
  const [cat, setCat] = useState('All');

  useEffect(() => {
    api.jobs.list().then(d => setJobs(d.filter((j: any) => j.published !== false))).catch(console.error).finally(() => setLoading(false));
  }, []);

  const list = jobs.filter(j => {
    const sq = q.toLowerCase();
    const tech = safeJson(j.tech_stack);
    return (
      (!sq ||
        j.title?.toLowerCase().includes(sq) ||
        j.company?.toLowerCase().includes(sq) ||
        tech.some((t: string) => t.toLowerCase().includes(sq))) &&
      (loc === 'All' || (loc === 'Remote' ? j.location === 'Remote' : j.location !== 'Remote')) &&
      (cat === 'All' || j.category === cat)
    );
  });

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingTop: 80, paddingBottom: 40 }}>
        <div style={wrap}>
          <BackButton />
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
            <div>
              <span className="badge badge-blue" style={{ marginBottom: 12, display: 'inline-flex' }}>
                {jobs.length} Open Positions
              </span>
              <h1 className="text-display-sm">
                Find your next <span className="grad-blue">tech role</span>
              </h1>
              <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>
                Curated opportunities — remote and onsite.
              </p>
            </div>
            <Link href="/services" className="btn btn-blue btn-sm">Need ATS Resume? →</Link>
          </div>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 32, paddingBottom: 80 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div className="input-icon" style={{ flex: 1, minWidth: 200 }}>
            <Search size={15} className="icon" />
            <input
              className="input"
              placeholder="Search jobs, companies, tech…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <select
            className="input"
            style={{ width: 'auto', minWidth: 140 }}
            value={loc}
            onChange={e => setLoc(e.target.value)}
          >
            <option value="All">All Locations</option>
            <option value="Remote">Remote</option>
            <option value="Onsite">Onsite</option>
          </select>
          <select
            className="input"
            style={{ width: 'auto', minWidth: 140 }}
            value={cat}
            onChange={e => setCat(e.target.value)}
          >
            <option value="All">All Categories</option>
            {['Frontend', 'Backend', 'DevOps', 'Full-Stack', 'AI/ML'].map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            <strong style={{ color: '#0f172a' }}>{list.length}</strong> jobs found
          </p>
          {(q || loc !== 'All' || cat !== 'All') && (
            <button
              style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => { setQ(''); setLoc('All'); setCat('All'); }}
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {list.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
                <Briefcase size={36} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
                <p>No jobs match your search.</p>
              </div>
            ) : (
              list.map(job => {
                const { c, bg } = CAT_COLOR[job.category] || { c: '#64748b', bg: '#f8fafc' };
                const tech = safeJson(job.tech_stack);
                return (
                  <div
                    key={job.id}
                    className="card"
                    style={{ padding: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: bg, color: c,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 14, flexShrink: 0,
                    }}>
                      {job.company?.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Link
                          href={`/jobs/${job.id}`}
                          style={{ fontWeight: 700, color: '#0f172a', textDecoration: 'none', fontSize: 14 }}
                        >
                          {job.title}
                        </Link>
                        <span className={`badge ${TYPE_BADGE[job.type] || 'badge-slate'}`}>{job.type}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
                        <span style={{ fontWeight: 600, color: '#475569' }}>{job.company}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} />{job.location}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Briefcase size={11} />{job.experience}
                        </span>
                        <span style={{ fontWeight: 700, color: c }}>{job.salary}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {tech.map((t: string) => <span key={t} className="tag">{t}</span>)}
                      </div>
                    </div>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="btn btn-outline btn-sm"
                      style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      View <ExternalLink size={12} />
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
