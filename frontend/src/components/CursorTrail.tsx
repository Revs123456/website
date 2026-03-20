'use client';
import { useEffect, useRef } from 'react';

export default function CursorTrail() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Don't run on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;
    let hovering = false;
    let raf: number;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    };

    const onEnter = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [role="button"]')) {
        hovering = true;
        dot.style.opacity  = '0';
        ring.style.width   = '44px';
        ring.style.height  = '44px';
        ring.style.background = 'rgba(37,99,235,0.12)';
        ring.style.borderColor = '#2563eb';
      }
    };

    const onLeave = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [role="button"]')) {
        hovering = false;
        dot.style.opacity  = '1';
        ring.style.width   = '32px';
        ring.style.height  = '32px';
        ring.style.background = 'transparent';
        ring.style.borderColor = '#2563eb';
      }
    };

    const loop = () => {
      // Lerp ring toward cursor
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      raf = requestAnimationFrame(loop);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onEnter);
    document.addEventListener('mouseout',  onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onEnter);
      document.removeEventListener('mouseout',  onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Small solid dot — snaps to cursor instantly */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: -4,
          left: -4,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#2563eb',
          pointerEvents: 'none',
          zIndex: 99999,
          transition: 'opacity 0.2s ease, transform 0.05s linear',
          willChange: 'transform',
        }}
      />

      {/* Larger ring — trails behind with lerp */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: -16,
          left: -16,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '1.5px solid #2563eb',
          background: 'transparent',
          pointerEvents: 'none',
          zIndex: 99998,
          transition: 'width 0.25s ease, height 0.25s ease, background 0.25s ease',
          willChange: 'transform',
        }}
      />
    </>
  );
}
