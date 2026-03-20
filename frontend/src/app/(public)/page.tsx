export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowRight, Briefcase, BookOpen, Map, Star, Check, Users, FileCheck, TrendingUp, Zap, Shield, Globe, HelpCircle, DollarSign, FileText, Trophy, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import TestimonialsSection from '@/components/TestimonialsSection';
import NewsletterSection from '@/components/NewsletterSection';
import LiveStat from '@/components/LiveStat';
import ScrollReveal from '@/components/ScrollReveal';
import HeroBubbles from '@/components/hero/HeroBubbles';

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
      <section style={{ background: 'linear-gradient(160deg, #edf0ff 0%, #f8f9ff 45%, #f0edff 100%)', borderBottom: '1px solid #e8eaf6', position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
        {/* Dot grid */}
        <div className="bg-dots" style={{ position: 'absolute', inset: 0, opacity: 0.45 }} />
        {/* Ambient radial glow — blue/violet behind hero text */}
        <div className="hero-glow" />
        {/* Noise / grain — premium texture */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <filter id="hero-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
        </svg>
        <div style={{ position: 'absolute', inset: 0, filter: 'url(#hero-noise)', opacity: 0.032, pointerEvents: 'none', zIndex: 2 }} />
        <HeroBubbles videoSrc="/hero-video.mp4" />

        <div className="hero-content" style={{ ...wrap, position: 'relative', zIndex: 10, textAlign: 'center' }}>

          {/* Trust badge with avatars */}
          <div className="anim-fade-up d-1" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 28, padding: '8px 18px 8px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(196,210,255,0.6)', backdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(99,102,241,0.08)' }}>
            {/* Stacked avatars */}
            <div style={{ display: 'flex', marginRight: 2 }}>
              {[
                'https://i.pravatar.cc/32?img=32',
                'https://i.pravatar.cc/32?img=47',
                'https://i.pravatar.cc/32?img=56',
              ].map((src, i) => (
                <img key={i} src={src} alt="user avatar" width={26} height={26} style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid #fff', marginLeft: i > 0 ? -8 : 0, objectFit: 'cover', display: 'block' }} />
              ))}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#4338ca' }}>
              Trusted by <LiveStat statKey="stat_community" fallback={stats.stat_community || '60K+'} /> developers &amp; students
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-display anim-fade-up d-2" style={{ marginBottom: 22, fontSize: 'clamp(2.2rem, 4.5vw, 3.7rem)' }}>
            Land your first <span className="grad-blue">tech job</span><br />faster with a proven roadmap
          </h1>

          {/* Subheading */}
          <p className="anim-fade-up d-3" style={{ fontSize: 17, color: '#6b7280', lineHeight: 1.8, maxWidth: 520, margin: '0 auto 44px', padding: '0 8px' }}>
            All-in-one platform to learn skills, build your resume, and get hired faster.
          </p>

          {/* CTAs — matching reference image */}
          <div className="anim-fade-up d-4" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: 60 }}>
            <Link href="/jobs" className="btn btn-primary btn-lg">Browse Jobs <ArrowRight size={16} /></Link>
            <Link href="/services" className="btn btn-outline btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} /> Checkout our Services
            </Link>
          </div>

          {/* Stats */}
          <div className="anim-fade-up d-5 hero-stats" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 44, paddingTop: 32, borderTop: '1px solid rgba(226,232,240,0.6)' }}>
            {[
              { statKey: 'stat_community',    fallback: stats.stat_community    || '60K+',   l: 'Users',         icon: Users,      c: '#2563eb', bg: '#eff6ff' },
              { statKey: 'stat_resumes',      fallback: stats.stat_resumes      || '1,200+', l: 'Resumes Built', icon: FileCheck,  c: '#7c3aed', bg: '#f5f3ff' },
              { statKey: 'stat_hired',        fallback: stats.stat_hired        || '500+',   l: 'Jobs Secured',  icon: Briefcase,  c: '#059669', bg: '#ecfdf5' },
              { statKey: 'stat_satisfaction', fallback: stats.stat_satisfaction || '98%',    l: 'Satisfaction',  icon: Star,       c: '#d97706', bg: '#fffbeb' },
            ].map(({ statKey, fallback, l, icon: Icon, c, bg }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div className="hero-stat-icon" style={{ background: bg }}>
                  <Icon size={14} style={{ color: c }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  <LiveStat statKey={statKey} fallback={fallback} countUp />
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: '#f8fafc', padding: '80px 0' }}>
        <div style={wrap}>
          <ScrollReveal><div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="badge badge-blue" style={{ marginBottom: 12, display: 'inline-flex' }}>Platform</span>
            <h2 className="text-display-sm" style={{ marginBottom: 10 }}>Everything you need to grow</h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 400, margin: '0 auto' }}>One platform covering every step of your tech career journey.</p>
          </div></ScrollReveal>
          <div className="feature-grid">
            {[
              { icon: Briefcase, c: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', title: 'Tech Job Board',   desc: 'Fresh remote & onsite opportunities from top companies, filtered for developers at every level.', href: '/jobs',     tags: ['Remote', 'Fresher-friendly', 'Daily updates'], delay: 0 },
              { icon: BookOpen,  c: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', title: 'Curated Courses', desc: 'Hand-picked from Udemy, Coursera, and Pluralsight — rated and organised by skill level.',          href: '/courses',  tags: ['Frontend', 'Backend', 'AI/ML'], delay: 100 },
              { icon: Map,       c: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', title: 'Career Roadmaps', desc: 'Step-by-step learning paths to go from zero to job-ready in your chosen tech stack.',              href: '/roadmaps', tags: ['Frontend', 'Backend', 'DevOps'], delay: 200 },
              { icon: Star,      c: '#d97706', bg: '#fffbeb', border: '#fde68a', title: 'Resume Services', desc: 'Expert ATS-optimised resumes, LinkedIn profiles, and 1-on-1 career coaching.',                     href: '/services', tags: ['From ₹499', 'ATS >90%', '48hr delivery'], delay: 300 },
            ].map(({ icon: Icon, c, bg, border, title, desc, href, tags, delay }) => (
              <ScrollReveal key={title} delay={delay}>
              <Link href={href} className="card card-blue" style={{ display: 'block', padding: 24, textDecoration: 'none' }}>
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
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '88px 0' }}>
        <div style={wrap}>
          <ScrollReveal><div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span className="badge badge-blue" style={{ marginBottom: 14, display: 'inline-flex' }}>How It Works</span>
            <h2 className="text-display-sm" style={{ marginBottom: 12 }}>Three steps to your dream job</h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 420, margin: '0 auto' }}>A structured path that takes you from learner to hired professional.</p>
          </div></ScrollReveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 8, position: 'relative' }}>
            {[
              { step: '01', icon: Map,       c: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', title: 'Choose your career path',                    desc: 'Select from Frontend, Backend, DevOps, AI/ML, or any tech track that matches your goals and timeline.' },
              { step: '02', icon: BookOpen,  c: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', title: 'Follow roadmaps & build skills',              desc: 'Access curated courses, practice projects, and expert-designed roadmaps to go from zero to job-ready.' },
              { step: '03', icon: Briefcase, c: '#059669', bg: '#ecfdf5', border: '#6ee7b7', title: 'Apply to jobs and get hired',                 desc: 'Use ATS-optimized resumes, our job board, and career coaching to land offers from top companies.' },
            ].map(({ step, icon: Icon, c, bg, border, title, desc }, i) => (
              <ScrollReveal key={step} delay={i * 150}>
              <div style={{ position: 'relative', textAlign: 'center', padding: '40px 32px', background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: 20 }}>
                {i < 2 && (
                  <div style={{ position: 'absolute', top: '40%', right: -20, width: 40, height: 2, background: 'linear-gradient(90deg, #e2e8f0, transparent)', zIndex: 1, display: 'none' }} className="step-connector" />
                )}
                <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 24px' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: bg, border: `2px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={24} style={{ color: c }} />
                  </div>
                  <div style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: '50%', background: c, color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${c}66` }}>{step}</div>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12, lineHeight: 1.4 }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{desc}</p>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={{ background: '#fff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '64px 0' }}>
        <div style={wrap}>
          <div className="stats-grid" style={{ gap: 32 }}>
            {[
              { icon: Users,      statKey: 'stat_community',    fallback: stats.stat_community    || '60K+',   label: 'Instagram community', c: '#2563eb', bg: '#eff6ff' },
              { icon: FileCheck,  statKey: 'stat_resumes',      fallback: stats.stat_resumes      || '1,200+', label: 'Resumes optimised',   c: '#7c3aed', bg: '#f5f3ff' },
              { icon: TrendingUp, statKey: 'stat_hired',        fallback: stats.stat_hired        || '500+',   label: 'Jobs landed',         c: '#059669', bg: '#ecfdf5' },
              { icon: Star,       statKey: 'stat_satisfaction', fallback: stats.stat_satisfaction || '98%',    label: 'Client satisfaction', c: '#d97706', bg: '#fffbeb' },
            ].map(({ icon: Icon, statKey, fallback, label, c, bg }, i) => (
              <ScrollReveal key={label} delay={i * 100}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Icon size={18} style={{ color: c }} />
                </div>
                <div className="stat-num" style={{ marginBottom: 4 }}><LiveStat statKey={statKey} fallback={fallback} countUp /></div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{label}</div>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section style={{ background: '#f8fafc', padding: '80px 0' }}>
        <div style={wrap}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 48, alignItems: 'center' }}>
            <ScrollReveal><div>
              <span className="badge badge-violet" style={{ marginBottom: 16, display: 'inline-flex' }}>Why Us</span>
              <h2 className="text-display-sm" style={{ marginBottom: 16 }}>Built for devs,<br />by devs</h2>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>
                We've been through the job hunt. We know what ATS systems reject, what recruiters skip, and what actually works. Our tools are built on that hard-won experience.
              </p>
              <Link href="/services" className="btn btn-blue">View Career Services <ArrowRight size={15} /></Link>
            </div></ScrollReveal>
            <div className="grid-2col">
              {[
                { icon: Zap,    c: '#2563eb', bg: '#eff6ff', t: '48hr Delivery',     d: 'Optimised resume within 2 business days.' },
                { icon: Shield, c: '#7c3aed', bg: '#f5f3ff', t: 'ATS Guaranteed',    d: 'Every resume scores 90%+ on major ATS.' },
                { icon: Globe,  c: '#0891b2', bg: '#ecfeff', t: 'Remote-First Jobs', d: 'Curated remote roles from global companies.' },
                { icon: TrendingUp, c: '#059669', bg: '#ecfdf5', t: 'Hiring Insights', d: 'Real data on what recruiters look for and which skills land offers.' },
              ].map(({ icon: Icon, c, bg, t, d }, i) => (
                <ScrollReveal key={t} delay={i * 80} scale>
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon size={16} style={{ color: c }} />
                  </div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{t}</h4>
                  <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{d}</p>
                </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TOOLS & RESOURCES ── */}
      <section style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '80px 0' }}>
        <div style={wrap}>
          <ScrollReveal><div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="badge badge-violet" style={{ marginBottom: 12, display: 'inline-flex' }}>Free Tools & Resources</span>
            <h2 className="text-display-sm" style={{ marginBottom: 10 }}>Tools to accelerate your career</h2>
            <p style={{ fontSize: 15, color: '#64748b' }}>Everything you need to prepare, apply, and succeed — completely free.</p>
          </div></ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: 16 }}>
            {[
              { icon: FileCheck,   c: '#2563eb', bg: '#eff6ff', title: 'ATS Score Checker',      desc: 'Instantly check how well your resume passes ATS filters.',             href: '/ats-checker'          },
              { icon: HelpCircle,  c: '#7c3aed', bg: '#f5f3ff', title: 'Interview Question Bank', desc: 'Real questions from Google, Amazon, Flipkart and more.',               href: '/interview-questions'  },
              { icon: DollarSign,  c: '#059669', bg: '#ecfdf5', title: 'Salary Insights',         desc: 'Know your market value before negotiating your next offer.',           href: '/salary-insights'      },
              { icon: Trophy,      c: '#d97706', bg: '#fffbeb', title: 'Success Stories',          desc: 'Read real journeys from developers who transformed their careers.',     href: '/success-stories'      },
              { icon: FileText,    c: '#0891b2', bg: '#ecfeff', title: 'Resume Templates',         desc: 'ATS-friendly templates built specifically for Indian tech jobs.',        href: '/templates'            },
              { icon: Users,       c: '#dc2626', bg: '#fef2f2', title: 'Community Q&A',            desc: 'Ask questions, share knowledge, and help others in the community.',    href: '/community'            },
            ].map(({ icon: Icon, c, bg, title, desc, href }, i) => (
              <ScrollReveal key={title} delay={i * 60}>
              <Link href={href} className="card card-blue" style={{ display: 'block', padding: 20, textDecoration: 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={18} style={{ color: c }} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
              </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <TestimonialsSection testimonials={testimonials} />

      {/* ── NEWSLETTER ── */}
      <NewsletterSection />


      {/* ── CTA ── */}
      <section style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', borderTop: '1px solid #e2e8f0', padding: '80px 0' }}>
        <ScrollReveal><div style={{ ...wrap, maxWidth: 680, textAlign: 'center' }}>
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
        </div></ScrollReveal>
      </section>
    </div>
  );
}
