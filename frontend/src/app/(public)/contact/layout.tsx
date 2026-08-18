import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — Get Career Help & Partnership Enquiries',
  description: 'Reach TechChampsByRev for career guidance, resume services, or collaborations. Connect via Instagram, LinkedIn, YouTube, WhatsApp, or email.',
  alternates: { canonical: 'https://www.techchampsbyrev.in/contact' },
  openGraph: {
    title: 'Contact TechChampsByRev',
    description: 'Get in touch for career guidance, resume services, or partnerships.',
    url: 'https://www.techchampsbyrev.in/contact',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
