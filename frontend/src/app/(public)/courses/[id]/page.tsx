import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { ArrowLeft, Clock, Star, Users, Check, ExternalLink, BookOpen } from 'lucide-react';
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

export default async function CourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let course: any = null;
  try { course = await api.courses.get(id); } catch {}
  if (!course) return (
    <div style={{ padding: '96px 24px', textAlign: 'center', color: '#94a3b8' }}>
      <p style={{ fontSize: 16, marginBottom: 16 }}>Course not found.</p>
      <Link href="/courses" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>← Back to Courses</Link>
    </div>
  );

  const { c, bg } = CAT_COLOR[course.category] || { c: '#64748b', bg: '#f8fafc' };
  const modules = safeJson(course.modules);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ ...wrap, paddingTop: 96, paddingBottom: 80 }}>
        <BackButton />

        {/* Hero banner */}
        <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 16, background: bg, border: `1px solid ${c}30` }}>
          <div style={{ padding: 48, textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <BookOpen size={40} style={{ color: `${c}50`, margin: '0 auto 16px', display: 'block' }} />
              <span className="badge badge-blue" style={{ marginBottom: 16, display: 'inline-flex' }}>{course.category}</span>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8, maxWidth: 480, margin: '0 auto 8px' }}>
                {course.title}
              </h1>
              {course.instructor && (
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>by {course.instructor}</p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20, fontSize: 13, color: '#475569' }}>
                {course.rating && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={13} fill="#f59e0b" style={{ color: '#f59e0b' }} />
                    <strong>{course.rating}</strong>&nbsp;rating
                  </span>
                )}
                {course.students && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={13} /><strong>{course.students}</strong>&nbsp;students
                  </span>
                )}
                {course.duration && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} /><strong>{course.duration}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA bar */}
        <div className="card" style={{ padding: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <div>
            {course.price && (
              <>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{course.price}</span>
                <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>· Lifetime access</span>
              </>
            )}
          </div>
          <a
            href={course.course_link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-blue"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Enroll on {course.platform} <ExternalLink size={13} />
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {course.description && (
              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>About this Course</h2>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{course.description}</p>
              </div>
            )}
            {modules.length > 0 && (
              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>What you'll learn</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                  {modules.map((m: string, i: number) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12,
                        borderRadius: 10, fontSize: 13, color: '#475569',
                        background: '#f8fafc', border: '1px solid #f1f5f9',
                      }}
                    >
                      <Check size={13} style={{ color: c, marginTop: 1, flexShrink: 0 }} />{m}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Details</h3>
              {[
                ['Duration',  course.duration],
                ['Level',     course.level],
                ['Platform',  course.platform],
                ['Students',  course.students],
                ['Instructor',course.instructor],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div
                  key={k}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}
                >
                  <span style={{ color: '#94a3b8' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ borderRadius: 12, padding: 20, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Want a job after this?</p>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Get an ATS resume that lands interviews.</p>
              <Link
                href="/services"
                className="btn btn-blue btn-sm"
                style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
              >
                Get Career Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
