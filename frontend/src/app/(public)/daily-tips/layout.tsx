import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Tech Career Tips — DSA, Interview, Resume & More',
  description: 'Daily bite-sized tips to advance your tech career. Topics include DSA, system design, resume building, interview prep, and frontend/backend coding.',
  alternates: { canonical: 'https://www.techchampsbyrev.in/daily-tips' },
  openGraph: {
    title: 'Daily Tech Career Tips | TechChampsByRev',
    description: 'Daily tips on DSA, interviews, resumes, and career growth for developers.',
    url: 'https://www.techchampsbyrev.in/daily-tips',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
