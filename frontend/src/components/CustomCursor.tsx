'use client';
import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    let raf: number;
    let mouseX = -100, mouseY = -100;
    let visible = false;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) {
        cursor.style.opacity = '1';
        visible = true;
      }
    };

    const onLeave = () => {
      cursor.style.opacity = '0';
      visible = false;
    };

    const onEnterInteractive = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [role="button"]')) {
        cursor.style.width  = '48px';
        cursor.style.height = '48px';
        cursor.style.background = 'rgba(37,99,235,0.15)';
        cursor.style.borderColor = '#2563eb';
        cursor.style.borderWidth = '2px';
      }
    };

    const onLeaveInteractive = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [role="button"]')) {
        cursor.style.width  = '28px';
        cursor.style.height = '28px';
        cursor.style.background = 'transparent';
        cursor.style.borderColor = '#2563eb';
        cursor.style.borderWidth = '1.5px';
      }
    };

    const loop = () => {
      cursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      raf = requestAnimationFrame(loop);
    };

    document.addEventListener('mousemove',  onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseover',  onEnterInteractive);
    document.addEventListener('mouseout',   onLeaveInteractive);
    raf = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('mousemove',  onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseover',  onEnterInteractive);
      document.removeEventListener('mouseout',   onLeaveInteractive);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        top: -14,
        left: -14,
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: '1.5px solid #2563eb',
        background: 'transparent',
        pointerEvents: 'none',
        zIndex: 99999,
        opacity: 0,
        transition: 'width 0.2s ease, height 0.2s ease, background 0.2s ease, opacity 0.3s ease',
        willChange: 'transform',
      }}
    />
  );
}
