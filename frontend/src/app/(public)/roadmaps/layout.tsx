import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer Roadmaps 2025 — Frontend, Backend, DevOps & AI/ML',
  description: 'Step-by-step learning roadmaps for Frontend, Backend, DevOps, and AI/ML developers. Know exactly what to learn and in what order.',
  alternates: { canonical: 'https://www.techchampsbyrev.in/roadmaps' },
  openGraph: {
    title: 'Developer Roadmaps 2025 | TechChampsByRev',
    description: 'Structured learning paths for every tech career track. Start your journey today.',
    url: 'https://www.techchampsbyrev.in/roadmaps',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
