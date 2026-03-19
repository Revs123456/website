export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowRight, Briefcase, BookOpen, Map, Star, Check, Users, FileCheck, TrendingUp, Zap, Shield, Globe, HelpCircle, DollarSign, FileText, Trophy, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import TestimonialsSection from '@/components/TestimonialsSection';
import NewsletterSection from '@/components/NewsletterSection';
import LiveStat from '@/components/LiveStat';

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

export default async function Home() {
  let stats: Record<string, string> = {
    stat_community: '60K+',
    stat_resumes: '1,200+',
    stat_hired: '500+',
    stat_satisfaction: '98%',
  };
  try { stats = await api.settings.getMap(); } catch {}

  let testimonials: any[] = [];
  try { testimonials = await api.testimonials.listPublished(); } catch {}

  return (
    <div style={{ background: '#f8fafc' }}>

      {/* ── HERO ── */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
        <div className="bg-dots" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,.07) 0%, transparent 70%)', top: -100, left: -100, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,.06) 0%, transparent 70%)', top: 0, right: -50, pointerEvents: 'none' }} />

        <div style={{ ...wrap, position: 'relative', zIndex: 10, paddingTop: 112, paddingBottom: 80, textAlign: 'center' }}>
          {/* Pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28, padding: '6px 16px', borderRadius: 99, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: 12, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
            Trusted by <LiveStat statKey="stat_community" fallback={stats.stat_community || '60K+'} /> developers &amp; students
          </div>

          <h1 className="text-display" style={{ marginBottom: 20 }}>
            The fastest way to<br /><span className="grad-blue">land a tech job</span>
          </h1>

          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 36px', padding: '0 8px' }}>
            Browse curated jobs, master skills with top courses, follow expert roadmaps, and get your resume ATS-optimized — all in one place.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 52 }}>
            <Link href="/jobs" className="btn btn-primary btn-lg">Browse Jobs <ArrowRight size={16} /></Link>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Sparkles size={22} style={{ color: '#7c3aed' }} />
              <Link href="/services" className="btn btn-outline btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} /> Checkout our Services
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 40, paddingTop: 32, borderTop: '1px solid #f1f5f9' }}>
            {[
              { statKey: 'stat_community',    fallback: stats.stat_community    || '60K+',   l: 'Community'   },
              { statKey: 'stat_resumes',      fallback: stats.stat_resumes      || '1,200+', l: 'Resumes'      },
              { statKey: 'stat_hired',        fallback: stats.stat_hired        || '500+',   l: 'Hired'        },
              { statKey: 'stat_satisfaction', fallback: stats.stat_satisfaction || '98%',    l: 'Satisfaction' },
            ].map(({ statKey, fallback, l }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}><LiveStat statKey={statKey} fallback={fallback} /></div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: '#f8fafc', padding: '80px 0' }}>
        <div style={wrap}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="badge badge-blue" style={{ marginBottom: 12, display: 'inline-flex' }}>Platform</span>
            <h2 className="text-display-sm" style={{ marginBottom: 10 }}>Everything you need to grow</h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 400, margin: '0 auto' }}>One platform covering every step of your tech career journey.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 }}>
            {[
              { icon: Briefcase, c: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', title: 'Tech Job Board',   desc: 'Fresh remote & onsite opportunities from top companies, filtered for developers at every level.', href: '/jobs',     tags: ['Remote', 'Fresher-friendly', 'Daily updates'] },
              { icon: BookOpen,  c: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', title: 'Curated Courses', desc: 'Hand-picked from Udemy, Coursera, and Pluralsight — rated and organised by skill level.',          href: '/courses',  tags: ['Frontend', 'Backend', 'AI/ML'] },
              { icon: Map,       c: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', title: 'Career Roadmaps', desc: 'Step-by-step learning paths to go from zero to job-ready in your chosen tech stack.',              href: '/roadmaps', tags: ['Frontend', 'Backend', 'DevOps'] },
              { icon: Star,      c: '#d97706', bg: '#fffbeb', border: '#fde68a', title: 'Resume Services', desc: 'Expert ATS-optimised resumes, LinkedIn profiles, and 1-on-1 career coaching.',                     href: '/services', tags: ['From ₹499', 'ATS >90%', '48hr delivery'] },
            ].map(({ icon: Icon, c, bg, border, title, desc, href, tags }) => (
              <Link key={title} href={href} className="card card-blue" style={{ display: 'block', padding: 24, textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: bg, border: `1px solid ${border}` }}>
                    <Icon size={20} style={{ color: c }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>{title}</h3>
                      <ArrowRight size={15} style={{ color: '#cbd5e1' }} />
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: 1.6 }}>{desc}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {tags.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={{ background: '#fff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '64px 0' }}>
        <div style={wrap}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32 }}>
            {[
              { icon: Users,      statKey: 'stat_community',    fallback: stats.stat_community    || '60K+',   label: 'Instagram community', c: '#2563eb', bg: '#eff6ff' },
              { icon: FileCheck,  statKey: 'stat_resumes',      fallback: stats.stat_resumes      || '1,200+', label: 'Resumes optimised',   c: '#7c3aed', bg: '#f5f3ff' },
              { icon: TrendingUp, statKey: 'stat_hired',        fallback: stats.stat_hired        || '500+',   label: 'Jobs landed',         c: '#059669', bg: '#ecfdf5' },
              { icon: Star,       statKey: 'stat_satisfaction', fallback: stats.stat_satisfaction || '98%',    label: 'Client satisfaction', c: '#d97706', bg: '#fffbeb' },
            ].map(({ icon: Icon, statKey, fallback, label, c, bg }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Icon size={18} style={{ color: c }} />
                </div>
                <div className="stat-num" style={{ marginBottom: 4 }}><LiveStat statKey={statKey} fallback={fallback} /></div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section style={{ background: '#f8fafc', padding: '80px 0' }}>
        <div style={wrap}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 64, alignItems: 'center' }}>
            <div>
              <span className="badge badge-violet" style={{ marginBottom: 16, display: 'inline-flex' }}>Why Us</span>
              <h2 className="text-display-sm" style={{ marginBottom: 16 }}>Built for devs,<br />by devs</h2>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>
                We've been through the job hunt. We know what ATS systems reject, what recruiters skip, and what actually works. Our tools are built on that hard-won experience.
              </p>
              <Link href="/services" className="btn btn-blue">View Career Services <ArrowRight size={15} /></Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { icon: Zap,    c: '#2563eb', bg: '#eff6ff', t: '48hr Delivery',     d: 'Optimised resume within 2 business days.' },
                { icon: Shield, c: '#7c3aed', bg: '#f5f3ff', t: 'ATS Guaranteed',    d: 'Every resume scores 90%+ on major ATS.' },
                { icon: Globe,  c: '#0891b2', bg: '#ecfeff', t: 'Remote-First Jobs', d: 'Curated remote roles from global companies.' },
                { icon: Users,  c: '#059669', bg: '#ecfdf5', t: 'Expert Coaches',    d: 'Senior engineers with 10+ years experience.' },
              ].map(({ icon: Icon, c, bg, t, d }) => (
                <div key={t} className="card" style={{ padding: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon size={16} style={{ color: c }} />
                  </div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{t}</h4>
                  <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TOOLS & RESOURCES ── */}
      <section style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '80px 0' }}>
        <div style={wrap}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="badge badge-violet" style={{ marginBottom: 12, display: 'inline-flex' }}>Free Tools & Resources</span>
            <h2 className="text-display-sm" style={{ marginBottom: 10 }}>Tools to accelerate your career</h2>
            <p style={{ fontSize: 15, color: '#64748b' }}>Everything you need to prepare, apply, and succeed — completely free.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { icon: FileCheck,   c: '#2563eb', bg: '#eff6ff', title: 'ATS Score Checker',      desc: 'Instantly check how well your resume passes ATS filters.',             href: '/ats-checker'          },
              { icon: HelpCircle,  c: '#7c3aed', bg: '#f5f3ff', title: 'Interview Question Bank', desc: 'Real questions from Google, Amazon, Flipkart and more.',               href: '/interview-questions'  },
              { icon: DollarSign,  c: '#059669', bg: '#ecfdf5', title: 'Salary Insights',         desc: 'Know your market value before negotiating your next offer.',           href: '/salary-insights'      },
              { icon: Trophy,      c: '#d97706', bg: '#fffbeb', title: 'Success Stories',          desc: 'Read real journeys from developers who transformed their careers.',     href: '/success-stories'      },
              { icon: FileText,    c: '#0891b2', bg: '#ecfeff', title: 'Resume Templates',         desc: 'ATS-friendly templates built specifically for Indian tech jobs.',        href: '/templates'            },
              { icon: Users,       c: '#dc2626', bg: '#fef2f2', title: 'Community Q&A',            desc: 'Ask questions, share knowledge, and help others in the community.',    href: '/community'            },
            ].map(({ icon: Icon, c, bg, title, desc, href }) => (
              <Link key={title} href={href} className="card card-blue" style={{ display: 'block', padding: 20, textDecoration: 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={18} style={{ color: c }} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <TestimonialsSection testimonials={testimonials} />

      {/* ── NEWSLETTER ── */}
      <NewsletterSection />

      {/* ── PRICING PREVIEW ── */}
      <section style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '80px 0' }}>
        <div style={{ ...wrap, maxWidth: 860 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="badge badge-amber" style={{ marginBottom: 12, display: 'inline-flex' }}>Pricing</span>
            <h2 className="text-display-sm" style={{ marginBottom: 10 }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: 15, color: '#64748b' }}>One-time payment. No subscriptions. Get hired or get your money back.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32, alignItems: 'start' }}>
            {[
              { name: 'Basic',   price: '₹499',   c: '#64748b', border: '#e2e8f0', bg: '#fff',    features: ['ATS-friendly template', 'Keyword optimisation', '1 revision', 'PDF delivery'], pop: false },
              { name: 'ATS Pro', price: '₹999',   c: '#2563eb', border: '#bfdbfe', bg: '#eff6ff', features: ['ATS score >90%', 'Cover letter', '3 revisions', 'Priority support'], pop: true },
              { name: 'Premium', price: '₹1,499', c: '#7c3aed', border: '#ddd6fe', bg: '#f5f3ff', features: ['LinkedIn optimisation', 'GitHub review', 'Mock interview', 'Unlimited revisions'], pop: false },
            ].map(({ name, price, c, border, bg, features, pop }) => (
              <div key={name} style={{ background: bg, border: `${pop ? '2px' : '1px'} solid ${border}`, borderRadius: 16, overflow: 'hidden' }}>
                {pop && (
                  <div style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe', padding: '6px 0', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#2563eb', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    ✦ Most Popular
                  </div>
                )}
                <div style={{ padding: 24 }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: c, marginBottom: 2 }}>{price}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{name}</div>
                  <ul style={{ listStyle: 'none', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569' }}>
                        <Check size={11} style={{ color: c, flexShrink: 0 }} />{f}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/order?service=${name.toLowerCase().replace(' ', '-')}`}
                    className={`btn btn-sm w-full ${pop ? 'btn-blue' : 'btn-outline'}`}
                    style={{ width: '100%', justifyContent: 'center' }}>
                    Get Started
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href="/services" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>Compare all features →</Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', borderTop: '1px solid #e2e8f0', padding: '80px 0' }}>
        <div style={{ ...wrap, maxWidth: 680, textAlign: 'center' }}>
          <h2 className="text-display-sm" style={{ marginBottom: 16 }}>Ready to get hired?</h2>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 36 }}>Join <LiveStat statKey="stat_hired" fallback={stats.stat_hired || '500+'} /> developers who landed their dream jobs through Tech Career Hub.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 36 }}>
            <Link href="/services" className="btn btn-primary btn-lg">Start Today <ArrowRight size={16} /></Link>
            <Link href="/jobs" className="btn btn-outline btn-lg">Browse Jobs</Link>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24 }}>
            {['No hidden fees', '48hr delivery', 'Free revisions', 'Money-back guarantee'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                <Check size={12} style={{ color: '#059669' }} />{t}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
