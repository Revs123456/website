import CommunityClient from './CommunityClient';
import BackButton from '@/components/BackButton';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

async function getCommunityPosts(): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}/community/published`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function CommunityPage() {
  const posts = await getCommunityPosts();
  return <CommunityClient posts={posts} />;
}
