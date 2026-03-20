import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { Check, Star, Clock, Users, Award, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

const FAQS = [
  { q: 'How long does delivery take?',  a: 'Basic: 3 days · ATS Pro: 2 days · Premium: 24 hours. Rush available on request.' },
  { q: "What if I'm not satisfied?",   a: "We offer free revisions within your plan's rounds. Still not happy? Full refund, no questions asked." },
  { q: 'Do you work with freshers?',    a: 'Absolutely. We specialize in crafting standout resumes for candidates with 0–1 years of experience.' },
  { q: 'How do I submit my info?',      a: "After ordering you'll receive a detailed questionnaire. Our experts build your resume based on your inputs." },
];

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

export default function ServicesPage() {
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Back button strip */}
      <div style={{ background: '#fff', paddingTop: 80 }}>
        <div style={{ ...wrap }}><BackButton /></div>
      </div>
      {/* Page header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingBottom: 40, textAlign: 'center' }}>
        <div style={{ ...wrap, maxWidth: 600 }}>
          <span className="badge badge-green" style={{ marginBottom: 12, display: 'inline-flex' }}>Career Services</span>
          <h1 className="text-display-sm">Everything you need to <span className="grad-blue">get hired</span></h1>
          <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>
            Powerful free tools for everyone. Expert-crafted paid plans when you want to stand out.
          </p>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 48, paddingBottom: 80 }}>

        {/* ── Two big option cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 64 }}>

          {/* Free card */}
          <div style={{ borderRadius: 20, border: '2px solid #bbf7d0', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={24} style={{ color: '#fff' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#059669', marginBottom: 2 }}>No credit card needed</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Free Tools</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
              Five battle-tested tools used by <strong>60,000+ developers</strong> — completely free, forever. Check your ATS score, explore roadmaps, prep for interviews, and find your next role.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Job Recommendations', 'Course Recommendations', 'Internship Listings', 'Developer Roadmaps', 'Interview Q&A Bank', 'Salary Insights', 'Resume Templates', 'ATS Resume Checker', 'Blog & Career Guides'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                  <Check size={14} style={{ color: '#059669', flexShrink: 0 }} />{f}
                </li>
              ))}
            </ul>
            <Link href="/services/free" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', borderRadius: 10, background: '#059669', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', alignSelf: 'flex-start', marginTop: 4 }}>
              Explore Free Tools <ArrowRight size={14} />
            </Link>
          </div>

          {/* Paid card */}
          <div style={{ borderRadius: 20, border: '2px solid #bfdbfe', background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={22} style={{ color: '#fff' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#2563eb', marginBottom: 2 }}>Expert-crafted · One-time payment</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Premium Services</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
              Human-written, keyword-optimized resumes that pass ATS filters and impress hiring managers. Trusted by <strong>1,200+ developers</strong> who landed jobs at top companies.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Profile Optimization (Naukri / LinkedIn / Indeed)', 'Job Search Assistance', 'Recruiter-Level Interview Q&A', 'Mock Interview (Live 1:1)', 'One-on-One Career Call', 'ATS Resume — India Format', 'ATS Resume — International Format', 'SAP Guidance'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                  <Check size={14} style={{ color: '#2563eb', flexShrink: 0 }} />{f}
                </li>
              ))}
            </ul>
            <Link href="/services/paid" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', alignSelf: 'flex-start', marginTop: 4 }}>
              See Pricing Plans <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* ── Proof strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 64 }}>
          {[
            { icon: Award, val: '1,200+', label: 'Resumes delivered', c: '#2563eb' },
            { icon: Star,  val: '98%',    label: 'Satisfied clients',  c: '#f59e0b' },
            { icon: Clock, val: '48hrs',  label: 'Average delivery',   c: '#059669' },
            { icon: Users, val: '500+',   label: 'Jobs landed',        c: '#7c3aed' },
          ].map(({ icon: Icon, val, label, c }) => (
            <div key={label} className="card" style={{ padding: 20, textAlign: 'center' }}>
              <Icon size={18} style={{ color: c, margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 2 }}>{val}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', textAlign: 'center', marginBottom: 32 }}>Common questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map(({ q, a }) => (
              <div key={q} className="card" style={{ padding: 20 }}>
                <p style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, marginBottom: 8 }}>{q}</p>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
