import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { ArrowLeft, Clock, User, Tag } from 'lucide-react';
import { api } from '@/lib/api';

const CAT_COLOR: Record<string, { c: string; bg: string }> = {
  'Career Advice':  { c: '#2563eb', bg: '#eff6ff' },
  'Resume Tips':    { c: '#059669', bg: '#ecfdf5' },
  'Interview Prep': { c: '#7c3aed', bg: '#f5f3ff' },
  'Job Search':     { c: '#d97706', bg: '#fffbeb' },
  Frontend:         { c: '#2563eb', bg: '#eff6ff' },
  Backend:          { c: '#7c3aed', bg: '#f5f3ff' },
  DevOps:           { c: '#0891b2', bg: '#ecfeff' },
  'Full-Stack':     { c: '#059669', bg: '#ecfdf5' },
  'AI/ML':          { c: '#d97706', bg: '#fffbeb' },
  General:          { c: '#64748b', bg: '#f8fafc' },
};

const wrap = { maxWidth: 720, margin: '0 auto', padding: '0 24px' } as const;

export default async function BlogDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let blog: any = null;
  try { blog = await api.blogs.get(id); } catch {}
  if (!blog) return (
    <div style={{ padding: '96px 24px', textAlign: 'center', color: '#94a3b8' }}>
      <p style={{ fontSize: 16, marginBottom: 16 }}>Article not found.</p>
      <Link href="/blogs" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>← Back to Blog</Link>
    </div>
  );

  const { c, bg } = CAT_COLOR[blog.category] || { c: '#64748b', bg: '#f8fafc' };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ ...wrap, paddingTop: 96, paddingBottom: 80 }}>
        <BackButton />

        {/* Article header */}
        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px',
              borderRadius: 999, fontSize: 11, fontWeight: 600, color: c, background: bg,
              marginBottom: 16,
            }}>
              <Tag size={10} />{blog.category}
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1.4, marginBottom: 16 }}>
              {blog.title}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#94a3b8' }}>
              {blog.author && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={13} />
                  <span style={{ fontWeight: 600, color: '#475569' }}>{blog.author}</span>
                </span>
              )}
              {blog.read_time && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={13} />{blog.read_time}
                </span>
              )}
              {blog.created_at && (
                <span>
                  {new Date(blog.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
          {blog.summary && (
            <>
              <div className="divider" />
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, marginTop: 20, fontStyle: 'italic' }}>
                {blog.summary}
              </p>
            </>
          )}
        </div>

        {/* Article content */}
        {blog.content && (
          <div className="card" style={{ padding: 32, marginBottom: 20 }}>
            <div style={{
              fontSize: 14, color: '#374151', lineHeight: 1.85,
              whiteSpace: 'pre-line',
            }}>
              {blog.content}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ borderRadius: 14, padding: 24, background: '#eff6ff', border: '1px solid #bfdbfe', textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            Ready to land your dream role?
          </p>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            Get an ATS-optimized resume and career guidance from our experts.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <Link href="/services" className="btn btn-blue btn-sm">Get Resume Help</Link>
            <Link href="/jobs" className="btn btn-outline btn-sm">Browse Jobs</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
