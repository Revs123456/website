'use client';
import { useEffect } from 'react';

const SELECTORS = 'a, button, [role="button"]';
const STRENGTH  = 0.35; // how far the element pulls (0–1)
const MAX_PULL  = 10;   // max px displacement

export default function MagneticCursor() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const elements: HTMLElement[] = [];
    const cleanups: (() => void)[] = [];

    function attach(el: HTMLElement) {
      if (elements.includes(el)) return;
      elements.push(el);

      el.style.transition = 'transform 0.3s cubic-bezier(0.16,1,0.3,1)';

      const onMove = (e: MouseEvent) => {
        const rect   = el.getBoundingClientRect();
        const cx     = rect.left + rect.width  / 2;
        const cy     = rect.top  + rect.height / 2;
        const dx     = e.clientX - cx;
        const dy     = e.clientY - cy;
        const dist   = Math.sqrt(dx * dx + dy * dy);
        const radius = Math.max(rect.width, rect.height) * 0.9;

        if (dist < radius) {
          const pull = 1 - dist / radius;
          const x = Math.max(-MAX_PULL, Math.min(MAX_PULL, dx * STRENGTH * pull));
          const y = Math.max(-MAX_PULL, Math.min(MAX_PULL, dy * STRENGTH * pull));
          el.style.transform = `translate(${x}px, ${y}px)`;
        }
      };

      const onLeave = () => {
        el.style.transform = 'translate(0px, 0px)';
      };

      el.addEventListener('mousemove',  onMove);
      el.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        el.removeEventListener('mousemove',  onMove);
        el.removeEventListener('mouseleave', onLeave);
        el.style.transform  = '';
        el.style.transition = '';
      });
    }

    // Attach to all existing elements
    document.querySelectorAll<HTMLElement>(SELECTORS).forEach(attach);

    // Watch for new elements added dynamically (navigation etc.)
    const obs = new MutationObserver(() => {
      document.querySelectorAll<HTMLElement>(SELECTORS).forEach(attach);
    });
    obs.observe(document.body, { childList: true, subtree: true });

    return () => {
      obs.disconnect();
      cleanups.forEach(fn => fn());
    };
  }, []);

  return null;
}
