import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { getPublicSettings } from '@/lib/settings';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings();
  const SITE = s.site_url;
  const siteName = s.site_name;
  const description = s.site_meta_description;
  const title = `${siteName} — Land Your Dream Tech Job`;

  return {
    metadataBase: new URL(SITE),
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: s.seo_keywords ? s.seo_keywords.split(',').map((k: string) => k.trim()) : ['tech jobs India', 'software engineering jobs', 'ATS resume', 'coding roadmap', 'developer career', 'frontend jobs', 'backend jobs', 'DevOps jobs'],
    authors: [{ name: s.founder_name, url: s.social_linkedin_url }],
    creator: siteName,
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      url: SITE,
      siteName,
      title,
      description,
      images: [{ url: '/tc.png', width: 1024, height: 1024, alt: `${siteName} Logo` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/tc.png'],
      creator: s.social_youtube_handle ? `@${s.social_youtube_handle.replace(/^@/, '')}` : undefined,
    },
    icons: {
      icon: [{ url: '/tc.png', sizes: '1024x1024', type: 'image/png' }],
      apple: [{ url: '/tc.png', sizes: '1024x1024' }],
      shortcut: '/tc.png',
    },
    // Phase 7 — PWA manifest reference. Next.js will inject the <link rel="manifest" /> tag.
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      title: 'TechChamps',
      statusBarStyle: 'default',
    },
    // Set browser chrome to match brand color on mobile
    themeColor: '#2563eb',
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: { canonical: SITE },
    verification: { google: 'FTyCDP2LHiMpv7AK3KsZ3Z-Tdm4bN__dyHDT1DsVM_E' },
  };
}

async function getOrgSchema() {
  const s = await getPublicSettings();
  const SITE = s.site_url;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: s.site_name,
    url: SITE,
    logo: `${SITE}/tc.png`,
    description: 'Career guidance platform helping developers land tech jobs in India through curated job listings, courses, resume services and mentorship.',
    founder: { '@type': 'Person', name: s.founder_name },
    sameAs: [
      s.social_instagram_url,
      s.social_linkedin_url,
      s.social_github_url,
      s.social_youtube_url,
    ].filter(Boolean),
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: s.contact_email },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const orgSchema = await getOrgSchema();
  return (
    // `suppressHydrationWarning` on <html> and <body> suppresses the standard
    // "server HTML didn't match client" warning when browser extensions (Grammarly,
    // dark-mode tools, password managers) inject classes/attributes into the
    // <html>/<body> tags BEFORE React hydrates. This is the Next.js-recommended
    // pattern: https://nextjs.org/docs/messages/react-hydration-error#solution-3
    //
    // It ONLY suppresses one level deep — real hydration bugs inside the tree
    // still surface as errors. So this is safe, not a "hide all my bugs" hack.
    <html lang="en" suppressHydrationWarning>
      <body
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema).replace(/<\/script>/gi, '<\\/script>') }}
        />
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{page_path:window.location.pathname});`}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
