'use client';
import { useEffect, useRef, useState } from 'react';

// Map href patterns / button text to cursor labels
function getLabel(el: HTMLElement): string {
  const a = el.closest('a');
  const btn = el.closest('button');

  if (a) {
    const href = a.getAttribute('href') || '';
    if (href.includes('jobs'))       return 'Explore →';
    if (href.includes('courses'))    return 'Learn →';
    if (href.includes('services'))   return 'View →';
    if (href.includes('roadmaps'))   return 'Explore →';
    if (href.includes('blogs'))      return 'Read →';
    if (href.includes('order'))      return 'Order →';
    if (href.includes('ats'))        return 'Check →';
    if (href === '/')                return 'Home →';
    return 'View →';
  }

  if (btn) return 'Click →';

  return 'View →';
}

export default function TextCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  const pos = useRef({ x: -200, y: -200 });
  const raf = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [role="button"]')) {
        setLabel(getLabel(t));
        el.style.opacity = '1';
        el.style.transform = `translate(${pos.current.x + 14}px, ${pos.current.y + 14}px) scale(1)`;
      }
    };

    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [role="button"]')) {
        el.style.opacity = '0';
        el.style.transform = `translate(${pos.current.x + 14}px, ${pos.current.y + 14}px) scale(0.8)`;
      }
    };

    const loop = () => {
      if (el.style.opacity !== '0') {
        el.style.transform = `translate(${pos.current.x + 14}px, ${pos.current.y + 14}px) scale(1)`;
      }
      raf.current = requestAnimationFrame(loop);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout',  onOut);
    raf.current = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout',  onOut);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        opacity: 0,
        transform: 'translate(-200px, -200px) scale(0.8)',
        transition: 'opacity 0.18s ease, transform 0.18s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 12px',
        borderRadius: 99,
        background: '#0f172a',
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 14px rgba(15,23,42,0.25)',
      }}
    >
      {label}
    </div>
  );
}
