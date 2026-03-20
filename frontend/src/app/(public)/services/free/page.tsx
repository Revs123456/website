import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { ArrowRight, Briefcase, BookOpen, Building2, Map, Search, CheckCircle, DollarSign, Layout, FileText, HelpCircle } from 'lucide-react';

const FREE_SERVICES = [
  {
    icon: Briefcase,
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    title: 'Job Recommendations',
    caption: 'Curated roles matched to your skills & goals',
    desc: 'Browse hand-picked job listings updated daily. Filter by role, stack, location and experience level. No spam, just relevant openings.',
    cta: 'Browse Jobs',
    href: '/jobs',
    highlights: ['Daily updated listings', 'Filter by stack & location', 'Fresher to senior roles', 'Direct apply links'],
  },
  {
    icon: BookOpen,
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    title: 'Course Recommendations',
    caption: 'Best-in-class courses hand-picked for you',
    desc: 'Curated from Udemy, Coursera, Pluralsight and more. Every course is vetted for quality and job relevance so you learn what matters.',
    cta: 'Explore Courses',
    href: '/courses',
    highlights: ['Vetted from top platforms', 'Free & paid options', 'Beginner to advanced', 'Rating & review included'],
  },
  {
    icon: Building2,
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
    title: 'Internship Listings',
    caption: 'Kickstart your career with real experience',
    desc: 'Discover internship opportunities at startups and MNCs. Perfect for students and freshers looking to build their first professional experience.',
    cta: 'Find Internships',
    href: '/jobs',
    highlights: ['Startup & MNC openings', 'Stipend details included', 'Remote & on-site', 'No experience needed'],
  },
  {
    icon: Map,
    color: '#059669',
    bg: '#ecfdf5',
    border: '#bbf7d0',
    title: 'Developer Roadmaps',
    caption: 'Your step-by-step path from zero to hired',
    desc: 'Structured learning paths for Frontend, Backend, DevOps and more. Know exactly what to learn, in what order, with no guesswork.',
    cta: 'View Roadmaps',
    href: '/roadmaps',
    highlights: ['Frontend, Backend, DevOps', 'Milestone-based progress', 'Curated resource links', 'Beginner friendly'],
  },
  {
    icon: HelpCircle,
    color: '#6366f1',
    bg: '#eef2ff',
    border: '#c7d2fe',
    title: 'Interview Q&A Bank',
    caption: '500+ questions answered by industry experts',
    desc: 'A curated bank of interview questions with model answers across Frontend, Backend, DevOps, HR and more. Built from real interview experiences.',
    cta: 'Browse Questions',
    href: '/interview-questions',
    highlights: ['500+ questions', 'Expert model answers', 'Category-wise filter', 'Real interview sourced'],
  },
  {
    icon: DollarSign,
    color: '#059669',
    bg: '#ecfdf5',
    border: '#bbf7d0',
    title: 'Salary Insights',
    caption: 'Real pay data — negotiate with confidence',
    desc: 'Know exactly what your role pays across companies, cities, and experience levels. Stop leaving money on the table.',
    cta: 'View Salaries',
    href: '/salary-insights',
    highlights: ['Role & city breakdown', 'Experience-level data', 'Updated regularly', 'India & global markets'],
  },
  {
    icon: Layout,
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
    title: 'Resume Templates',
    caption: 'Clean, ATS-ready templates — free to download',
    desc: 'Pick from professionally designed resume templates built for the tech industry. All formats are ATS-safe and ready to customise.',
    cta: 'Browse Templates',
    href: '/templates',
    highlights: ['ATS-safe layouts', 'Tech-industry focused', 'PDF & Word formats', 'Free to download'],
  },
  {
    icon: FileText,
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    title: 'ATS Resume Checker',
    caption: 'Score your resume before recruiters see it',
    desc: 'Instantly analyse your resume against ATS algorithms. Get a score, see missing keywords, and fix issues before you apply.',
    cta: 'Check My Resume',
    href: '/ats-checker',
    highlights: ['Instant ATS score', 'Keyword gap analysis', 'Actionable suggestions', 'Free & unlimited'],
  },
  {
    icon: Search,
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    title: 'Blog & Career Guides',
    caption: 'Practical advice written by tech professionals',
    desc: 'In-depth articles on job hunting, resume writing, interview prep, salary negotiation, and career growth — all written by people who have been there.',
    cta: 'Read the Blog',
    href: '/blogs',
    highlights: ['Interview tips', 'Resume writing guides', 'Salary negotiation', 'Career path advice'],
  },
];

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

export default function FreeServicesPage() {
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingTop: 80, paddingBottom: 40 }}>
        <div style={{ ...wrap }}>
          <BackButton />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#ecfdf5', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={24} style={{ color: '#059669' }} />
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#059669' }}>No sign-up · No payment</span>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Free Services</h1>
            </div>
          </div>
          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 560 }}>
            Six powerful tools used by 60,000+ developers — completely free, forever. No catch.
          </p>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {FREE_SERVICES.map(({ icon: Icon, color, bg, border, title, caption, desc, cta, href, highlights }) => (
            <div key={title} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Top */}
              <div style={{ padding: 28, background: bg, borderBottom: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color, marginBottom: 4 }}>{caption}</div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{title}</h2>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{desc}</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {highlights.map(h => (
                    <li key={h} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569' }}>
                      <CheckCircle size={12} style={{ color, flexShrink: 0 }} />{h}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div style={{ padding: '0 24px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', letterSpacing: '0.04em' }}>FREE</span>
                </div>
                <Link href={href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 0', borderRadius: 10, background: color, color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                  {cta} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
