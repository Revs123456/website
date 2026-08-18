import type { Metadata } from 'next';
import SuccessStoriesClient from './SuccessStoriesClient';
import BackButton from '@/components/BackButton';
import { getPublicSettings } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Success Stories — Developers Who Got Hired at Top Companies',
  description: 'Real stories from developers who landed jobs at top tech companies with help from TechChampsByRev. See their salary hikes, companies, and journeys.',
  alternates: { canonical: 'https://www.techchampsbyrev.in/success-stories' },
  openGraph: {
    title: 'Success Stories | TechChampsByRev',
    description: 'Real developers, real results. See how they got placed at top companies.',
    url: 'https://www.techchampsbyrev.in/success-stories',
  },
};

const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/v1`;

async function getStories(): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}/success-stories/published`, { cache: 'no-store' });
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

export default async function SuccessStoriesPage() {
  const [stories, settings] = await Promise.all([getStories(), getPublicSettings()]);
  if (settings.feature_success_stories === 'false') return COMING_SOON;
  return <SuccessStoriesClient stories={stories} />;
}
