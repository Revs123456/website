'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

/**
 * Signed-in visitors don't need the marketing homepage — send them to their
 * dashboard instead. Mirrors the inverse check already used on /dashboard
 * (redirect to '/' when logged out), just the other direction.
 *
 * Renders nothing and only acts once auth state resolves, so logged-out
 * visitors (the common case) see the homepage instantly with no flash —
 * this only ever redirects, never blocks or shows a loading state.
 */
export default function HomeRedirectGuard() {
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  return null;
}
