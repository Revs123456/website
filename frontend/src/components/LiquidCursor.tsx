'use client';
import { useEffect, useRef } from 'react';

export default function LiquidCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const dot  = dotRef.current;
    const blob = blobRef.current;
    if (!dot || !blob) return;

    let mouseX = -100, mouseY = -100;
    let blobX  = -100, blobY  = -100;
    let raf: number;
    let isHovering = false;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform  = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      dot.style.opacity    = '1';
      blob.style.opacity   = '1';
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [role="button"]')) {
        isHovering = true;
        dot.style.transform  = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%) scale(0)`;
        blob.style.width     = '56px';
        blob.style.height    = '56px';
        blob.style.background = 'rgba(37,99,235,0.18)';
        blob.style.border    = '2px solid #2563eb';
      }
    };

    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [role="button"]')) {
        isHovering = false;
        dot.style.transform  = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%) scale(1)`;
        blob.style.width     = '40px';
        blob.style.height    = '40px';
        blob.style.background = 'transparent';
        blob.style.border    = '2px solid #2563eb';
      }
    };

    const onLeave = () => {
      dot.style.opacity  = '0';
      blob.style.opacity = '0';
    };

    const loop = () => {
      // Blob lags heavily behind the dot — liquid merge effect
      blobX += (mouseX - blobX) * 0.1;
      blobY += (mouseY - blobY) * 0.1;

      const dx   = mouseX - blobX;
      const dy   = mouseY - blobY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Stretch blob toward the dot when they're apart
      const stretchX = isHovering ? 1 : Math.max(1, 1 + dist * 0.012);
      const stretchY = isHovering ? 1 : Math.max(0.7, 1 - dist * 0.006);
      const angle    = Math.atan2(dy, dx) * (180 / Math.PI);

      blob.style.transform =
        `translate(${blobX}px, ${blobY}px) translate(-50%, -50%)` +
        ` rotate(${angle}deg) scaleX(${stretchX}) scaleY(${stretchY})`;

      raf = requestAnimationFrame(loop);
    };

    document.addEventListener('mousemove',  onMove);
    document.addEventListener('mouseover',  onOver);
    document.addEventListener('mouseout',   onOut);
    document.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('mousemove',  onMove);
      document.removeEventListener('mouseover',  onOver);
      document.removeEventListener('mouseout',   onOut);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Small inner dot — snaps instantly */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#2563eb',
          pointerEvents: 'none',
          zIndex: 99999,
          opacity: 0,
          transition: 'transform 0.15s ease, opacity 0.3s ease',
          willChange: 'transform',
        }}
      />

      {/* Outer blob — lags + stretches toward dot */}
      <div
        ref={blobRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'transparent',
          border: '2px solid #2563eb',
          pointerEvents: 'none',
          zIndex: 99998,
          opacity: 0,
          transition: 'width 0.25s ease, height 0.25s ease, background 0.25s ease, opacity 0.3s ease',
          willChange: 'transform',
          mixBlendMode: 'multiply',
        }}
      />
    </>
  );
}
