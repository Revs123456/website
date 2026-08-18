import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tech Jobs in India — Frontend, Backend, DevOps & More',
  description: 'Browse curated software engineering jobs in India. Find frontend, backend, DevOps, full-stack, and AI/ML roles at top companies. Apply directly.',
  alternates: { canonical: 'https://www.techchampsbyrev.in/jobs' },
  openGraph: {
    title: 'Tech Jobs in India | TechChampsByRev',
    description: 'Curated tech job listings for developers in India. New roles added daily.',
    url: 'https://www.techchampsbyrev.in/jobs',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
