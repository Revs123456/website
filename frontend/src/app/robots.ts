import type { MetadataRoute } from 'next';

const SITE = 'https://www.techchampsbyrev.in';

/**
 * Tells crawlers what to index and where the sitemap lives.
 * Disallows admin routes + per-user pages (no value indexed, privacy risk).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/jobs/',
          '/blogs/',
          '/courses/',
          '/community/',
          '/u/',
          '/tools/',
          '/roast/',
          '/quiz/',
        ],
        disallow: [
          '/admin',
          '/admin/',
          '/account',
          '/dashboard',
          '/notifications',
          '/saved-jobs',
          '/applications',
          '/login',
          '/api/',
          '/order',
          '/optimizer/',           // private per-user output
          '/mock-interview/',      // private per-user output
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
