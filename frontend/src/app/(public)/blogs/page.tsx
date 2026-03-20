'use client';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { useEffect, useState } from 'react';
import { Search, FileText, Clock, User, ArrowRight } from 'lucide-react';
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

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

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

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');

  useEffect(() => {
    api.blogs.list()
      .then(data => setBlogs(data.filter((b: any) => b.published !== false)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(blogs.map(b => b.category).filter(Boolean)))];

  const list = blogs.filter(b =>
    (!q || b.title?.toLowerCase().includes(q.toLowerCase()) || b.author?.toLowerCase().includes(q.toLowerCase()) || b.summary?.toLowerCase().includes(q.toLowerCase())) &&
    (cat === 'All' || b.category === cat)
  );

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingTop: 80, paddingBottom: 40 }}>
        <div style={wrap}>
          <BackButton />
          <span className="badge badge-blue" style={{ marginBottom: 12, display: 'inline-flex' }}>
            {blogs.length} Articles
          </span>
          <h1 className="text-display-sm">
            Tech career <span className="grad-blue">insights</span>
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>
            Practical advice on jobs, resumes, interviews and career growth.
          </p>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 32, paddingBottom: 80 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div className="input-icon" style={{ flex: 1, minWidth: 200 }}>
            <Search size={15} className="icon" />
            <input
              className="input"
              placeholder="Search articles…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <select
            className="input"
            style={{ width: 'auto', minWidth: 160 }}
            value={cat}
            onChange={e => setCat(e.target.value)}
          >
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            <strong style={{ color: '#0f172a' }}>{list.length}</strong> articles
          </p>
          {(q || cat !== 'All') && (
            <button
              style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => { setQ(''); setCat('All'); }}
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <FileText size={36} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
            <p>No articles found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {list.map(blog => {
              const { c, bg } = CAT_COLOR[blog.category] || { c: '#64748b', bg: '#f8fafc' };
              return (
                <Link
                  key={blog.id}
                  href={`/blogs/${blog.id}`}
                  style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff', overflow: 'hidden' }}
                >
                  {/* Color header strip */}
                  <div style={{ height: 6, background: c }} />
                  <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
                        borderRadius: 999, fontSize: 11, fontWeight: 600,
                        color: c, background: bg,
                      }}>
                        {blog.category}
                      </span>
                      {blog.read_time && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}>
                          <Clock size={11} />{blog.read_time}
                        </span>
                      )}
                    </div>
                    <h3 style={{
                      fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 10, lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {blog.title}
                    </h3>
                    {blog.summary && (
                      <p style={{
                        fontSize: 13, color: '#64748b', lineHeight: 1.6, flex: 1,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        marginBottom: 16,
                      }}>
                        {blog.summary}
                      </p>
                    )}
                    <div className="divider" style={{ marginBottom: 16 }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {blog.author && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                          <User size={12} />{blog.author}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: c, fontWeight: 600 }}>
                        Read <ArrowRight size={10} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
