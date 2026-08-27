import type { Metadata } from 'next';
import Link from 'next/link';
import { Flame, Brain, Trophy, ArrowRight, Sparkles, MessageSquare, Bot } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Free AI Career Tools',
  description: 'AI-powered tools: resume roast, resume optimizer, mock interview, career coach, archetype quiz, and more. Built for developers.',
};

const TOOLS = [
  // Phase 4 — AI flagship features
  {
    href: '/tools/resume-optimizer',
    icon: <Sparkles size={22} />,
    color: '#2563eb', bg: '#eff6ff',
    label: 'AI Resume Optimizer',
    blurb: 'Paste your resume + a JD. AI rewrites your bullets to mirror the JD\'s keywords without inventing experience.',
    badge: 'PRO',
  },
  {
    href: '/tools/mock-interview',
    icon: <MessageSquare size={22} />,
    color: '#7c3aed', bg: '#f5f3ff',
    label: 'AI Mock Interview',
    blurb: 'Multi-turn interview with an AI panelist. Adaptive questions for any role. Scored feedback at the end.',
    badge: 'PRO',
  },
  {
    href: '/tools/revbot',
    icon: <Bot size={22} />,
    color: '#0891b2', bg: '#ecfeff',
    label: 'RevBot Career Coach',
    blurb: 'Your AI career coach. Asks about your career, points you to the right tools, gives Indian-context advice.',
    badge: 'AI',
  },
  // Phase 3 — viral acquisition
  {
    href: '/tools/resume-roast',
    icon: <Flame size={22} />,
    color: '#dc2626', bg: '#fef2f2',
    label: 'Resume Roast',
    blurb: 'Brutally honest AI feedback in 10 seconds. Score 0-100. No signup needed.',
    badge: 'FREE',
  },
  {
    href: '/tools/career-quiz',
    icon: <Brain size={22} />,
    color: '#7c3aed', bg: '#f5f3ff',
    label: 'Career Archetype Quiz',
    blurb: '10 questions to find out which tech career path actually fits you. Shareable result card.',
    badge: '2 MIN',
  },
  {
    href: '/tools/placement-story',
    icon: <Trophy size={22} />,
    color: '#16a34a', bg: '#f0fdf4',
    label: 'Placement Story',
    blurb: 'Just got placed? AI polishes your story for LinkedIn. We feature top stories on our site.',
    badge: 'NEW',
  },
];

export default function ToolsLanding() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '96px 24px 60px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: '#0f172a', margin: '0 0 10px', letterSpacing: '-0.03em' }}>
          Free Career Tools
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', margin: 0, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
          Powered by AI. Built for developers. No signup required for most tools.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {TOOLS.map(t => (
          <Link
            key={t.href}
            href={t.href}
            className="card card-blue"
            style={{ padding: 22, textDecoration: 'none', display: 'block' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: t.bg, color: t.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {t.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {t.label}
                  </h2>
                  <span className="badge" style={{ background: t.bg, color: t.color, border: `1px solid ${t.color}30`, fontSize: 9 }}>
                    {t.badge}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 }}>
                  {t.blurb}
                </p>
                <span style={{ fontSize: 12, color: t.color, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Try it <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
