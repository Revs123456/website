import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

// Replace with your actual GA4 Measurement ID from analytics.google.com
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

export const metadata: Metadata = {
  title: 'TechChampsByRev — Land Your Dream Tech Job',
  description: 'Browse curated tech jobs, courses, roadmaps and get ATS-optimized resumes. Trusted by 60K+ developers.',
  icons: {
    icon: [{ url: '/tc.png', sizes: '1024x1024', type: 'image/png' }],
    apple: [{ url: '/tc.png', sizes: '1024x1024' }],
    shortcut: '/tc.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
