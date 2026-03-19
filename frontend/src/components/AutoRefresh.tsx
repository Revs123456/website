'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const channel = new BroadcastChannel('admin-update');
    channel.onmessage = () => router.refresh();
    return () => channel.close();
  }, [router]);

  return null;
}
