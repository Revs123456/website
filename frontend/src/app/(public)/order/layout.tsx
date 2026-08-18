import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Resume Service | TechChampsByRev',
  description: 'Order an ATS-optimized resume, LinkedIn profile makeover, or career coaching session.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
