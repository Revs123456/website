import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free ATS Resume Checker — Score Your Resume Instantly',
  description: 'Check if your resume passes ATS (Applicant Tracking System) filters. Paste your resume, get an instant ATS score, keyword analysis, and improvement tips. Free.',
  alternates: { canonical: 'https://www.techchampsbyrev.in/ats-checker' },
  openGraph: {
    title: 'Free ATS Resume Checker | TechChampsByRev',
    description: 'Instantly score your resume against ATS filters. Know what to fix before applying.',
    url: 'https://www.techchampsbyrev.in/ats-checker',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
