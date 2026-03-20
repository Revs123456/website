'use client';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { useEffect, useState } from 'react';
import { Search, BookOpen, Star, Clock, ArrowRight, CheckCircle, Sparkles, Lock } from 'lucide-react';
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

function isFree(course: any): boolean {
  if (course.is_free === true) return true;
  if (course.is_free === false) return false;
  const p = parseFloat(course.price);
  return !course.price || p === 0;
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', animation: 'spin .8s linear infinite' }} />
    </div>
  );
}

function CourseCard({ course }: { course: any }) {
  const { c, bg } = CAT_COLOR[course.category] || { c: '#64748b', bg: '#f8fafc' };
  const modules = safeJson(course.modules);
  const free = isFree(course);
  return (
    <Link
      href={`/courses/${course.id}`}
      style={{ display: 'block', overflow: 'hidden', textDecoration: 'none', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff', transition: 'box-shadow .2s, transform .2s' }}
    >
      <div style={{ height: 112, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, position: 'relative' }}>
        <BookOpen size={40} style={{ color: `${c}60` }} />
        <span style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, letterSpacing: '0.04em',
          background: free ? '#dcfce7' : '#eff6ff',
          color: free ? '#15803d' : '#1d4ed8',
          border: `1px solid ${free ? '#bbf7d0' : '#bfdbfe'}`,
        }}>
          {free ? 'FREE' : `₹${course.price || 'PAID'}`}
        </span>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="badge badge-blue">{course.category}</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{course.platform}</span>
        </div>
        <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
          <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>{modules.length} modules</p>
        )}
        <div className="divider" style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{course.duration}</span>
          <span className={`badge ${LVL_BADGE[course.level] || 'badge-slate'}`}>{course.level}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: c, fontWeight: 600 }}>View <ArrowRight size={10} /></span>
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({ icon: Icon, iconBg, iconColor, gradient, title, subtitle }: any) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{title}</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ height: 2, background: gradient, borderRadius: 4, width: 200 }} />
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
    api.courses.list().then(d => setCourses(d.filter((c: any) => c.published !== false))).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c =>
    (!q || c.title?.toLowerCase().includes(q.toLowerCase()) || c.platform?.toLowerCase().includes(q.toLowerCase()) || c.instructor?.toLowerCase().includes(q.toLowerCase())) &&
    (cat === 'All' || c.category === cat) &&
    (lvl === 'All' || c.level === lvl)
  );

  const freeCourses = filtered.filter(isFree);
  const paidCourses = filtered.filter(c => !isFree(c));

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingTop: 80, paddingBottom: 40 }}>
        <div style={wrap}>
          <BackButton />
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
        {/* Filters */}
        <div className="filter-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
          <div className="input-icon" style={{ flex: 1, minWidth: 200 }}>
            <Search size={15} className="icon" />
            <input className="input" placeholder="Search courses, instructors, platforms…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <select className="input" style={{ width: 'auto', minWidth: 140 }} value={cat} onChange={e => setCat(e.target.value)}>
            <option value="All">All Categories</option>
            {['Frontend', 'Backend', 'DevOps', 'Full-Stack', 'AI/ML'].map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="input" style={{ width: 'auto', minWidth: 140 }} value={lvl} onChange={e => setLvl(e.target.value)}>
            <option value="All">All Levels</option>
            {['Beginner', 'Intermediate', 'Advanced'].map(l => <option key={l}>{l}</option>)}
          </select>
          {(q || cat !== 'All' || lvl !== 'All') && (
            <button style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setQ(''); setCat('All'); setLvl('All'); }}>
              Clear filters
            </button>
          )}
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {/* ── FREE COURSES ── */}
            <div style={{ marginBottom: 64 }}>
              <SectionHeader
                icon={CheckCircle}
                iconBg="#ecfdf5"
                iconColor="#059669"
                gradient="linear-gradient(90deg,#059669,transparent)"
                title="Free Courses"
                subtitle={`${freeCourses.length} courses · No payment needed`}
              />
              {freeCourses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                  <BookOpen size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                  <p>No free courses match your filters.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
                  {freeCourses.map(course => <CourseCard key={course.id} course={course} />)}
                </div>
              )}
            </div>

            {/* ── PAID COURSES ── */}
            <div>
              <SectionHeader
                icon={Sparkles}
                iconBg="#eff6ff"
                iconColor="#2563eb"
                gradient="linear-gradient(90deg,#2563eb,#7c3aed,transparent)"
                title="Premium Courses"
                subtitle={`${paidCourses.length} courses · In-depth, structured learning`}
              />
              {paidCourses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                  <Lock size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                  <p>No paid courses match your filters.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
                  {paidCourses.map(course => <CourseCard key={course.id} course={course} />)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
