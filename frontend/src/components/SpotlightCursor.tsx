'use client';
import { useEffect, useRef } from 'react';

export default function SpotlightCursor() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const glow = glowRef.current;
    if (!glow) return;

    let mouseX = window.innerWidth  / 2;
    let mouseY = window.innerHeight / 2;
    let curX   = mouseX;
    let curY   = mouseY;
    let raf: number;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const loop = () => {
      curX += (mouseX - curX) * 0.08;
      curY += (mouseY - curY) * 0.08;
      glow.style.transform = `translate(${curX}px, ${curY}px)`;
      raf = requestAnimationFrame(loop);
    };

    document.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      style={{
        position: 'fixed',
        top: -300,
        left: -300,
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.10) 0%, rgba(124,58,237,0.06) 40%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform',
        mixBlendMode: 'normal',
      }}
    />
  );
}
