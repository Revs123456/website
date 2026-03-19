'use client';
import { useEffect, useRef } from 'react';

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  scale = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  scale?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in-view');
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${scale ? 'reveal-scale' : 'reveal'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
