'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Search, BookOpen, Star, Clock, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

const CAT_COLOR: Record<string, { c: string; bg: string }> = {
  Frontend:     { c: '#2563eb', bg: '#eff6ff' },
  Backend:      { c: '#7c3aed', bg: '#f5f3ff' },
  DevOps:       { c: '#0891b2', bg: '#ecfeff' },
  'Full-Stack': { c: '#059669', bg: '#ecfdf5' },
  'AI/ML':      { c: '#d97706', bg: '#fffbeb' },
};

const LVL_BADGE: Record<string, string> = {
  Beginner:     'badge-green',
  Intermediate: 'badge-amber',
  Advanced:     'badge-red',
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
        border: '3px solid #e2e8f0', borderTopColor: '#7c3aed',
        animation: 'spin .8s linear infinite',
      }} />
    </div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [lvl, setLvl] = useState('All');

  useEffect(() => {
    api.courses.list().then(setCourses).catch(console.error).finally(() => setLoading(false));
  }, []);

  const list = courses.filter(c =>
    (!q || c.title?.toLowerCase().includes(q.toLowerCase()) || c.platform?.toLowerCase().includes(q.toLowerCase()) || c.instructor?.toLowerCase().includes(q.toLowerCase())) &&
    (cat === 'All' || c.category === cat) &&
    (lvl === 'All' || c.level === lvl)
  );

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingTop: 80, paddingBottom: 40 }}>
        <div style={wrap}>
          <span className="badge badge-violet" style={{ marginBottom: 12, display: 'inline-flex' }}>
            {courses.length} Curated Courses
          </span>
          <h1 className="text-display-sm">Level up your <span className="grad-blue">skills</span></h1>
          <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>
            Hand-picked from Udemy, Coursera, Pluralsight and more.
          </p>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 32, paddingBottom: 80 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
          <div className="input-icon" style={{ flex: 1, minWidth: 200 }}>
            <Search size={15} className="icon" />
            <input
              className="input"
              placeholder="Search courses, instructors, platforms…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
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
          <select
            className="input"
            style={{ width: 'auto', minWidth: 140 }}
            value={lvl}
            onChange={e => setLvl(e.target.value)}
          >
            <option value="All">All Levels</option>
            {['Beginner', 'Intermediate', 'Advanced'].map(l => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            <strong style={{ color: '#0f172a' }}>{list.length}</strong> courses found
          </p>
          {(q || cat !== 'All' || lvl !== 'All') && (
            <button
              style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => { setQ(''); setCat('All'); setLvl('All'); }}
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <BookOpen size={36} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
            <p>No courses found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {list.map(course => {
              const { c, bg } = CAT_COLOR[course.category] || { c: '#64748b', bg: '#f8fafc' };
              const modules = safeJson(course.modules);
              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  style={{ display: 'block', overflow: 'hidden', textDecoration: 'none', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff' }}
                >
                  <div style={{ height: 112, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
                    <BookOpen size={40} style={{ color: `${c}60` }} />
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span className="badge badge-blue">{course.category}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{course.platform}</span>
                    </div>
                    <h3 style={{
                      fontWeight: 700, color: '#0f172a', fontSize: 13, marginBottom: 6,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {course.title}
                    </h3>
                    {course.instructor && (
                      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>by {course.instructor}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                      <Star size={12} fill="#f59e0b" style={{ color: '#f59e0b' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{course.rating}</span>
                      {course.students && (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>({course.students} students)</span>
                      )}
                    </div>
                    {modules.length > 0 && (
                      <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
                        {modules.length} modules
                      </p>
                    )}
                    <div className="divider" style={{ marginBottom: 16 }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />{course.duration}
                      </span>
                      <span className={`badge ${LVL_BADGE[course.level] || 'badge-slate'}`}>{course.level}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: c, fontWeight: 600 }}>
                        View <ArrowRight size={10} />
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
