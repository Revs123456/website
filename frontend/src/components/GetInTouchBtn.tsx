'use client';
import Link from 'next/link';
import { useState, useRef } from 'react';

type Phase = 'idle' | 'flyOut' | 'reset' | 'flyIn';

export default function GetInTouchBtn({ href = '/services' }: { href?: string }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function trigger() {
    if (phase !== 'idle') return;

    // Phase 1: fly out to the right
    setPhase('flyOut');

    // Phase 2: instantly jump to the left (no transition)
    const t1 = setTimeout(() => {
      setPhase('reset');
      // Phase 3: fly back in from the left
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setPhase('flyIn'))
      );
    }, 680);

    // Phase 4: return to idle
    const t2 = setTimeout(() => setPhase('idle'), 1500);

    timers.current = [t1, t2];
  }

  const flying = phase !== 'idle';

  const planeLeft =
    phase === 'flyOut' ? 'calc(100% + 24px)'
    : phase === 'reset' ? -28
    : 14;

  const planeTransform =
    phase === 'flyOut'
      ? 'translateY(-50%) scale(1.15)'
      : 'translateY(-50%) scale(1)';

  const planeTransition =
    phase === 'reset'
      ? 'none'
      : phase === 'flyOut'
      ? 'left 0.65s cubic-bezier(0.4,0,0.2,1), transform 0.65s cubic-bezier(0.4,0,0.2,1)'
      : phase === 'flyIn'
      ? 'left 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)'
      : 'left 0.4s ease, transform 0.4s ease';

  return (
    <Link
      href={href}
      onMouseEnter={trigger}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 160,
        height: 40,
        background: '#eff6ff',
        borderRadius: 50,
        fontWeight: 600,
        fontSize: 13,
        color: '#2563eb',
        textDecoration: 'none',
        boxShadow: '0 2px 10px rgba(37,99,235,0.18)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Paper plane */}
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: planeLeft,
          transform: planeTransform,
          transition: planeTransition,
          display: 'flex',
          alignItems: 'center',
          color: '#2563eb',
          zIndex: 2,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21.426 11.095 3.926 2.345A1 1 0 0 0 2.652 3.57l2.96 7.43H11a1 1 0 0 1 0 2H5.612l-2.96 7.43a1 1 0 0 0 1.274 1.225l17.5-8.75a1 1 0 0 0 0-1.81Z" />
        </svg>
      </span>

      {/* "Get in touch" */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: flying ? 0 : 1,
          transform: flying ? 'translateY(-7px)' : 'translateY(0)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
          pointerEvents: 'none',
        }}
      >
        Get in touch
      </span>

      {/* "Let's go!" */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: flying ? 1 : 0,
          transform: flying ? 'translateY(0)' : 'translateY(8px)',
          transition: flying
            ? 'opacity 0.22s ease 0.3s, transform 0.22s ease 0.3s'
            : 'opacity 0.22s ease, transform 0.22s ease',
          pointerEvents: 'none',
        }}
      >
        Let's go!
      </span>
    </Link>
  );
}
