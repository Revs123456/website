import { useEffect, useRef } from 'react';

/**
 * Listens on BroadcastChannel('admin-update') and calls `fn` whenever
 * the admin panel makes a change (create / update / delete).
 * This makes public pages refresh their data automatically without a full page reload.
 */
export function useAdminSync(fn: () => void) {
  const ref = useRef(fn);
  ref.current = fn;

  useEffect(() => {
    const ch = new BroadcastChannel('admin-update');
    ch.onmessage = () => ref.current();
    return () => ch.close();
  }, []);
}
