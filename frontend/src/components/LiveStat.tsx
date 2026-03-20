'use client';
import { useEffect, useRef, useState } from 'react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

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

function parse(v: string) {
  const clean = v.replace(/,/g, '');
  const m = clean.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  return { num: parseFloat(m[2]), prefix: m[1], suffix: m[3] };
}

function formatNum(n: number): string {
  return n >= 1000 ? n.toLocaleString('en-US') : String(n);
}

export default function LiveStat({
  statKey,
  fallback,
  countUp = false,
}: {
  statKey: string;
  fallback: string;
  countUp?: boolean;
}) {
  const [value, setValue] = useState(fallback);
  const [display, setDisplay] = useState(fallback);
  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);
  const didAnimate = useRef(false);

  function animateCount(target: string) {
    cancelAnimationFrame(rafRef.current);
    const parsed = parse(target);
    if (!parsed) { setDisplay(target); return; }
    const { num, prefix, suffix } = parsed;
    const duration = 1600;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setDisplay(`${prefix}${formatNum(Math.round(eased * num))}${suffix}`);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
        didAnimate.current = true;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  // Live data fetch
  useEffect(() => {
    fetchStats().then(data => { if (data[statKey]) setValue(data[statKey]); });
    const ch = new BroadcastChannel('admin-update');
    ch.onmessage = () => {
      _promise = null;
      fetchStats().then(data => { if (data[statKey]) setValue(data[statKey]); });
    };
    return () => { ch.close(); cancelAnimationFrame(rafRef.current); };
  }, [statKey]);

  // Trigger count-up on scroll into view
  useEffect(() => {
    if (!countUp) { setDisplay(value); return; }
    if (didAnimate.current) { setDisplay(value); return; }

    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animateCount(value);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, countUp]);

  if (!countUp) return <>{value}</>;
  return <span ref={ref}>{display}</span>;
}
