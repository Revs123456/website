const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/v1`;

export type PublicSettings = Record<string, string>;

// Fallback values used when the API is unreachable (build-time or SSR error)
const FALLBACKS: PublicSettings = {
  site_name: 'TechChampsByRev',
  founder_name: 'Revanth Kalamshetty',
  site_url: 'https://www.techchampsbyrev.in',
  site_meta_description:
    'Browse curated tech jobs, courses, roadmaps and get ATS-optimized resumes. Trusted by 60K+ developers in India.',
  hero_subheading: 'Trusted by 60K+ developers & students',
  contact_email: 'connectwithrev@gmail.com',
  social_instagram_url: 'https://www.instagram.com/techchamps_by.rev/',
  social_instagram_handle: '@techchamps_by.rev',
  social_linkedin_url: 'https://www.linkedin.com/in/revanthkalamshetty/',
  social_linkedin_handle: 'revanthkalamshetty',
  social_youtube_url: 'https://www.youtube.com/@RevanthKalamshetty',
  social_youtube_handle: '@RevanthKalamshetty',
  social_github_url: 'https://github.com/Revs123456',
  social_github_handle: 'Revs123456',
  social_whatsapp_url: 'https://wa.me/917671008062',
  slot_booking_price: '500',
};

export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const res = await fetch(`${API}/settings/public`, {
      next: { revalidate: 300 }, // revalidate every 5 minutes
      signal: AbortSignal.timeout(8000), // don't hang forever if the API is down
    });
    if (!res.ok) return FALLBACKS;
    const data: PublicSettings = await res.json();
    // Merge with fallbacks so missing keys always have a value
    return { ...FALLBACKS, ...data };
  } catch {
    return FALLBACKS;
  }
}
