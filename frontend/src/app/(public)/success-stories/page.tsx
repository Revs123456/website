import SuccessStoriesClient from './SuccessStoriesClient';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

async function getStories(): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}/success-stories/published`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function SuccessStoriesPage() {
  const stories = await getStories();
  return <SuccessStoriesClient stories={stories} />;
}
