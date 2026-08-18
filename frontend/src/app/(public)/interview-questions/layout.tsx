import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tech Interview Questions & Answers — DSA, System Design, HR',
  description: 'Practice real interview questions from top tech companies. Filter by difficulty (Easy/Medium/Hard), category (DSA, HR, Frontend), and company.',
  alternates: { canonical: 'https://www.techchampsbyrev.in/interview-questions' },
  openGraph: {
    title: 'Tech Interview Questions | TechChampsByRev',
    description: 'Real interview Q&A from Google, Amazon, Flipkart and more. Practice DSA, system design, and HR rounds.',
    url: 'https://www.techchampsbyrev.in/interview-questions',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
