import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Best Tech Courses — Learn Frontend, Backend, AI/ML & DevOps',
  description: 'Hand-picked tech courses from Udemy, Coursera, YouTube and more. Learn React, Node.js, Python, DevOps and AI/ML. Filter by category and level.',
  alternates: { canonical: 'https://www.techchampsbyrev.in/courses' },
  openGraph: {
    title: 'Best Tech Courses | TechChampsByRev',
    description: 'Hand-picked courses to advance your tech career. Filter by skill, level and price.',
    url: 'https://www.techchampsbyrev.in/courses',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
