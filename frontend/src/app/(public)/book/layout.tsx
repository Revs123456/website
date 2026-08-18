import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a 1:1 Career Call — ₹500 | TechChampsByRev',
  description: 'Book a 30-minute personal career call with Revanth Kalamshetty. Get guidance on job search, resume, interview prep, and career growth. Only ₹500.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
