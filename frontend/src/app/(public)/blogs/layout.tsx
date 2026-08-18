import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tech Career Blog — Interview Tips, Resume Advice & Job Search',
  description: 'Read actionable career advice, resume tips, interview guides, and tech insights. Written by developers for developers in India.',
  alternates: { canonical: 'https://www.techchampsbyrev.in/blogs' },
  openGraph: {
    title: 'Tech Career Blog | TechChampsByRev',
    description: 'Career advice, resume tips, and interview prep for developers.',
    url: 'https://www.techchampsbyrev.in/blogs',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
