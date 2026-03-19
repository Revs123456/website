'use client';
import { useEffect, useState } from 'react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

// Deduplicate: all LiveStat components on the page share one fetch
let _promise: Promise<Record<string, string>> | null = null;
function fetchStats() {
  if (!_promise) {
    _promise = fetch(`${BASE}/settings/map`, { cache: 'no-store' })
      .then(r => r.json())
      .catch(() => ({}))
      .finally(() => { _promise = null; });
  }
  return _promise;
}

export default function LiveStat({ statKey, fallback }: { statKey: string; fallback: string }) {
  const [value, setValue] = useState(fallback);

  function refresh() {
    _promise = null; // bust the cache so we get fresh data
    fetchStats().then(data => { if (data[statKey]) setValue(data[statKey]); });
  }

  useEffect(() => {
    refresh();
    const channel = new BroadcastChannel('admin-update');
    channel.onmessage = () => refresh();
    return () => channel.close();
  }, [statKey]);

  return <>{value}</>;
}
