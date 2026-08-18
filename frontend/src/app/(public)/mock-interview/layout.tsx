import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Mock Interview Practice — Technical & HR Rounds',
  description: 'Practice mock interviews with real technical and HR questions from top companies. Build confidence before your actual interview. Completely free tool.',
  alternates: { canonical: 'https://www.techchampsbyrev.in/mock-interview' },
  openGraph: {
    title: 'Free Mock Interview Practice | TechChampsByRev',
    description: 'Simulate real interviews with technical and HR questions. Practice until you are ready.',
    url: 'https://www.techchampsbyrev.in/mock-interview',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
