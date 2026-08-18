import type { Metadata } from 'next';
import CommunityClient from './CommunityClient';
import BackButton from '@/components/BackButton';
import { getPublicSettings } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Tech Community Q&A — Ask & Answer Career Questions',
  description: 'Community-driven Q&A for tech professionals in India. Ask questions about interviews, jobs, salaries, and career growth. Get answers from the community.',
  alternates: { canonical: 'https://www.techchampsbyrev.in/community' },
  openGraph: {
    title: 'Tech Community Q&A | TechChampsByRev',
    description: 'Ask and answer career questions. Learn from 60K+ developers in the community.',
    url: 'https://www.techchampsbyrev.in/community',
  },
};

const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/v1`;

async function getCommunityPosts(): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}/community/published`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const COMING_SOON = (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
    <div style={{ textAlign: 'center', padding: '0 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Coming Soon</h1>
      <p style={{ color: '#64748b' }}>This feature is currently unavailable.</p>
    </div>
  </div>
);

export default async function CommunityPage() {
  const [posts, settings] = await Promise.all([getCommunityPosts(), getPublicSettings()]);
  if (settings.feature_community === 'false') return COMING_SOON;
  return <CommunityClient posts={posts} />;
}
