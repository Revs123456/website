import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resume & Career Services — ATS Optimization, LinkedIn & Coaching',
  description: 'Professional resume writing, ATS optimization, LinkedIn profile makeover, and 1:1 career coaching. Starting from ₹499. Trusted by 60K+ developers.',
  alternates: { canonical: 'https://www.techchampsbyrev.in/services' },
  openGraph: {
    title: 'Resume & Career Services | TechChampsByRev',
    description: 'ATS-optimized resumes, LinkedIn makeovers, and career coaching. Starting ₹499.',
    url: 'https://www.techchampsbyrev.in/services',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
