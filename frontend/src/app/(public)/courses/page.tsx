'use client';
import BackButton from '@/components/BackButton';
import { useEffect, useState } from 'react';
import { Search, BookOpen, Star, Clock, ExternalLink, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useAdminSync } from '@/hooks/useAdminSync';

const CAT_COLOR: Record<string, { c: string; bg: string }> = {
  Frontend:     { c: '#2563eb', bg: '#eff6ff' },
  Backend:      { c: '#7c3aed', bg: '#f5f3ff' },
  DevOps:       { c: '#0891b2', bg: '#ecfeff' },
  'Full-Stack': { c: '#059669', bg: '#ecfdf5' },
  'AI/ML':      { c: '#d97706', bg: '#fffbeb' },
};

const LVL_COLOR: Record<string, string> = {
  Beginner:     '#059669',
  Intermediate: '#d97706',
  Advanced:     '#dc2626',
};

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

function isFree(course: any): boolean {
  if (course.is_free === true) return true;
  if (course.is_free === false) return false;
  const p = parseFloat(course.price);
  return !course.price || p === 0;
}

function CourseCard({ course }: { course: any }) {
  const { c, bg } = CAT_COLOR[course.category] || { c: '#64748b', bg: '#f8fafc' };
  const free = isFree(course);
  const lvlColor = LVL_COLOR[course.level] || '#64748b';

  return (
    <div style={{ borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Top color bar */}
      <div style={{ height: 4, background: c }} />

      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={16} style={{ color: c }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: c, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{course.platform}</span>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
            background: free ? '#dcfce7' : '#eff6ff',
            color: free ? '#15803d' : '#1d4ed8',
            border: `1px solid ${free ? '#bbf7d0' : '#bfdbfe'}`,
            flexShrink: 0,
          }}>
            {free ? 'FREE' : (course.price || 'PAID')}
          </span>
        </div>

        {/* Title */}
        <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, lineHeight: 1.4, margin: 0 }}>
          {course.title}
        </h3>

        {/* Instructor */}
        {course.instructor && (
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>by {course.instructor}</p>
        )}

        {/* Description */}
        {course.description && (
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {course.description}
          </p>
        )}

        {/* Meta */}
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 12, fontSize: 12, color: '#64748b', marginTop: 'auto' }}>
          {course.rating && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={11} fill="#f59e0b" style={{ color: '#f59e0b' }} />
              <strong style={{ color: '#0f172a' }}>{course.rating}</strong>
            </span>
          )}
          {course.duration && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} />{course.duration}
            </span>
          )}
          {course.students && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={11} />{course.students}
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 600, color: lvlColor, border: `1px solid ${lvlColor}30`, background: `${lvlColor}10`, padding: '1px 8px', borderRadius: 99 }}>
            {course.level}
          </span>
        </div>

        {/* CTA */}
        {course.course_link ? (
          <a
            href={course.course_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: c, color: '#fff', textDecoration: 'none',
              transition: 'opacity .15s',
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
          >
            <ExternalLink size={13} /> Go to Course
          </a>
        ) : (
          <div style={{ padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 500, background: '#f1f5f9', color: '#94a3b8', textAlign: 'center' }}>
            Link coming soon
          </div>
        )}
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [lvl, setLvl] = useState('All');
  const [type, setType] = useState('All');

  const load = () => {
    api.courses.list()
      .then(d => setCourses(d.filter((c: any) => c.published !== false)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useAdminSync(load);

  const filtered = courses.filter(c =>
    (!q || c.title?.toLowerCase().includes(q.toLowerCase()) ||
      c.platform?.toLowerCase().includes(q.toLowerCase()) ||
      c.instructor?.toLowerCase().includes(q.toLowerCase())) &&
    (cat === 'All' || c.category === cat) &&
    (lvl === 'All' || c.level === lvl) &&
    (type === 'All' || (type === 'Free' ? isFree(c) : !isFree(c)))
  );

  const categories = ['All', ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];
  const levels = ['All', ...Array.from(new Set(courses.map(c => c.level).filter(Boolean)))];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingTop: 80, paddingBottom: 40 }}>
        <div style={wrap}>
          <BackButton />
          <div style={{ marginTop: 16 }}>
            <span className="badge badge-violet" style={{ marginBottom: 12, display: 'inline-flex' }}>
              {courses.length} Curated Courses
            </span>
            <h1 className="text-display-sm">Level up your <span className="grad-blue">skills</span></h1>
            <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>
              Hand-picked from Udemy, YouTube, Coursera, and more. Click any course to start learning.
            </p>
          </div>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 32, paddingBottom: 80 }}>
        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 12, marginBottom: 32 }}>
          <div style={{ position: 'relative' as const, flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search courses, instructors, platforms…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <select className="input" style={{ width: 'auto', minWidth: 140 }} value={cat} onChange={e => setCat(e.target.value)}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="input" style={{ width: 'auto', minWidth: 130 }} value={lvl} onChange={e => setLvl(e.target.value)}>
            {levels.map(l => <option key={l} value={l}>{l === 'All' ? 'All Levels' : l}</option>)}
          </select>
          <select className="input" style={{ width: 'auto', minWidth: 110 }} value={type} onChange={e => setType(e.target.value)}>
            <option value="All">All Types</option>
            <option value="Free">Free</option>
            <option value="Paid">Paid</option>
          </select>
          {(q || cat !== 'All' || lvl !== 'All' || type !== 'All') && (
            <button
              style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
              onClick={() => { setQ(''); setCat('All'); setLvl('All'); setType('All'); }}
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', animation: 'spin .8s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <BookOpen size={40} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>No courses found</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>{filtered.length} course{filtered.length !== 1 ? 's' : ''} found</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 20 }}>
              {filtered.map(course => <CourseCard key={course.id} course={course} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
