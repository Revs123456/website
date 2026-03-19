import Link from 'next/link';
import { ArrowLeft, MapPin, Briefcase, Clock, Check, ExternalLink, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';

const CAT_COLOR: Record<string, { c: string; bg: string }> = {
  Frontend:     { c: '#2563eb', bg: '#eff6ff' },
  Backend:      { c: '#7c3aed', bg: '#f5f3ff' },
  DevOps:       { c: '#0891b2', bg: '#ecfeff' },
  'Full-Stack': { c: '#059669', bg: '#ecfdf5' },
  'AI/ML':      { c: '#d97706', bg: '#fffbeb' },
};

function safeJson(s: any): string[] {
  if (Array.isArray(s)) return s;
  try { return JSON.parse(s || '[]'); } catch { return []; }
}

const wrap = { maxWidth: 896, margin: '0 auto', padding: '0 24px' } as const;

export default async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let job: any = null;
  try { job = await api.jobs.get(id); } catch {}
  if (!job) return (
    <div style={{ padding: '96px 24px', textAlign: 'center', color: '#94a3b8' }}>
      <p style={{ fontSize: 16, marginBottom: 16 }}>Job not found.</p>
      <Link href="/jobs" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>← Back to Jobs</Link>
    </div>
  );

  const { c, bg } = CAT_COLOR[job.category] || { c: '#64748b', bg: '#f8fafc' };
  const tech = safeJson(job.tech_stack);
  const requirements = safeJson(job.requirements);
  const benefits = safeJson(job.benefits);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ ...wrap, paddingTop: 96, paddingBottom: 80 }}>
        <Link
          href="/jobs"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', textDecoration: 'none', marginBottom: 32 }}
        >
          <ArrowLeft size={15} /> Back to Jobs
        </Link>

        <div className="card" style={{ padding: 28, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: bg, color: c,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, flexShrink: 0,
              }}>
                {job.company?.charAt(0)}
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{job.title}</h1>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#64748b', marginBottom: 8 }}>{job.company}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-green">{job.type}</span>
                  <span className="badge badge-blue">{job.category}</span>
                </div>
              </div>
            </div>
            <a
              href={job.apply_link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-blue btn-sm"
              style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Apply Now <ExternalLink size={13} />
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { icon: MapPin,     label: 'Location',   val: job.location,   ic: '#2563eb' },
              { icon: Briefcase,  label: 'Experience', val: job.experience, ic: '#7c3aed' },
              { icon: DollarSign, label: 'Salary',     val: job.salary,     ic: '#059669' },
              { icon: Clock,      label: 'Posted',     val: job.created_at ? new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A', ic: '#d97706' },
            ].map(({ icon: Icon, label, val, ic }) => (
              <div key={label} style={{ padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={12} style={{ color: ic }} />{val}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>About the Role</h2>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{job.description}</p>
            </div>
            {requirements.length > 0 && (
              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Requirements</h2>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {requirements.map((r: string, i: number) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#475569' }}>
                      <Check size={14} style={{ color: c, flexShrink: 0, marginTop: 2 }} />{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tech.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Tech Stack</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {tech.map((t: string) => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
            )}
            {benefits.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Benefits</h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {benefits.map((b: string) => (
                    <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
                      <Check size={11} style={{ color: '#059669' }} />{b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div style={{ borderRadius: 12, padding: 20, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Boost your application</p>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>ATS-optimised resume that gets you noticed.</p>
              <Link
                href="/services"
                className="btn btn-blue btn-sm"
                style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
              >
                Get Resume Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
