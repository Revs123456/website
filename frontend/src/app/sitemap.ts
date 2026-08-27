import { MetadataRoute } from 'next';

const SITE = 'https://www.techchampsbyrev.in';
const API  = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/v1`;

// 1 hour ISR — sitemap recompute is cheap but doesn't need to be live.
export const revalidate = 3600;

/**
 * Fetch IDs from a list endpoint, handling both array and { data: [] } shapes.
 * Returns empty on failure (network, 5xx, timeout) — sitemap should never
 * fail the build over a backend hiccup.
 */
async function fetchIds(endpoint: string): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${API}/${endpoint}`, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : data.data ?? [])
      .map((item: any) => item.id)
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Fetch usernames of public-profile users for /u/<username> indexing. */
async function fetchPublicProfileUsernames(): Promise<string[]> {
  // No bulk endpoint — would need an admin route. Skip until we add one;
  // individual profiles still index via their share links and social.
  return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobIds, blogIds, courseIds, communityIds, profileUsernames] = await Promise.all([
    fetchIds('jobs/published'),
    fetchIds('blogs/published'),
    fetchIds('courses/published'),
    fetchIds('community/published'),
    fetchPublicProfileUsernames(),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    // Marketing — top priority
    { url: SITE,                              lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE}/jobs`,                    lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE}/services`,                lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    // Content
    { url: `${SITE}/courses`,                 lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE}/blogs`,                   lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE}/interview-questions`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE}/roadmaps`,                lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/daily-tips`,              lastModified: now, changeFrequency: 'daily',   priority: 0.7 },
    { url: `${SITE}/salary-insights`,         lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${SITE}/templates`,               lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    // Phase 2 — engagement
    { url: `${SITE}/challenges`,              lastModified: now, changeFrequency: 'daily',   priority: 0.7 },
    // Phase 3 — viral tools
    { url: `${SITE}/tools`,                   lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE}/tools/resume-roast`,      lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/tools/career-quiz`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/tools/placement-story`,   lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    // Phase 4 — AI tools
    { url: `${SITE}/tools/resume-optimizer`,  lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/tools/mock-interview`,    lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/tools/revbot`,            lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/mock-interview`,          lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    // Phase 6 — community
    { url: `${SITE}/community`,               lastModified: now, changeFrequency: 'daily',   priority: 0.6 },
    { url: `${SITE}/success-stories`,         lastModified: now, changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${SITE}/contact`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const dynamicPages: MetadataRoute.Sitemap = [
    ...jobIds.map(id      => ({ url: `${SITE}/jobs/${id}`,      lastModified: now, changeFrequency: 'weekly'  as const, priority: 0.7 })),
    ...blogIds.map(id     => ({ url: `${SITE}/blogs/${id}`,     lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...courseIds.map(id   => ({ url: `${SITE}/courses/${id}`,   lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...communityIds.map(id => ({ url: `${SITE}/community/${id}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...profileUsernames.map(u => ({ url: `${SITE}/u/${u}`,      lastModified: now, changeFrequency: 'weekly' as const, priority: 0.5 })),
  ];

  return [...staticPages, ...dynamicPages];
}
