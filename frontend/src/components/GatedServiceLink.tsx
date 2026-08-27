'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import AuthModal from './AuthModal';

/**
 * Wraps a service CTA (Get Started / Book a Slot) so clicking it requires a
 * signed-in user first — same "action-gated" pattern as the mock-interview
 * tool and community answers (open AuthModal instead of navigating; once
 * signed in, a normal click proceeds). Exists as its own component because
 * one caller (/services/paid) is a server component and can't hold the
 * useUser()/onClick logic itself.
 */
export default function GatedServiceLink({
  href, className, style, children,
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const [authOpen, setAuthOpen] = useState(false);

  function handleClick(e: React.MouseEvent) {
    // Auth state hasn't resolved yet — don't let an anonymous click sneak
    // through, and don't flash the sign-in modal for someone who's actually
    // logged in but whose session just hasn't loaded yet.
    if (loading) { e.preventDefault(); return; }
    if (!user) { e.preventDefault(); setAuthOpen(true); }
  }

  return (
    <>
      <Link href={href} className={className} style={style} onClick={handleClick}>
        {children}
      </Link>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" />
    </>
  );
}
