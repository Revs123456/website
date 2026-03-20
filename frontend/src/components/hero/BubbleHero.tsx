'use client';
import { useEffect, useRef } from 'react';

const BUBBLES = [
  { id: 'video',       size: 185, x: 27,  y: 6,  delay: 0,   dur: 6.5, type: 'video'        },
  { id: 'white',       size: 150, x: 62,  y: 4,  delay: 1.2, dur: 7.2, type: 'glossy-white' },
  { id: 'wireframe',   size: 128, x: 81,  y: 10, delay: 2.1, dur: 8.0, type: 'wireframe'    },
  { id: 'purple',      size: 76,  x: 79,  y: 46, delay: 0.7, dur: 5.8, type: 'glossy-purple'},
  { id: 'dark-glass',  size: 168, x: 52,  y: 38, delay: 1.8, dur: 7.5, type: 'dark-glass'   },
  { id: 'code',        size: 178, x: 40,  y: 52, delay: 0.4, dur: 6.8, type: 'code'         },
  { id: 'iridescent',  size: 130, x: 63,  y: 55, delay: 2.5, dur: 9.0, type: 'iridescent'   },
  { id: 'wireframe-sm',size: 88,  x: 10,  y: 42, delay: 1.5, dur: 7.0, type: 'wireframe-sm' },
  { id: 'dot-globe',   size: 162, x: 12,  y: 55, delay: 0.9, dur: 8.2, type: 'dot-globe'    },
];

export default function BubbleHero({ videoSrc }: { videoSrc?: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const onMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width  - 0.5;
      const cy = (e.clientY - rect.top)  / rect.height - 0.5;

      section.querySelectorAll<HTMLElement>('[data-depth]').forEach(el => {
        const d = parseFloat(el.dataset.depth || '1');
        el.style.transform = `translate(${cx * d * 22}px, ${cy * d * 14}px)`;
      });
    };

    section.addEventListener('mousemove', onMove);
    return () => section.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div
      ref={sectionRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        minHeight: 520,
        background: '#000',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop text */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        <span style={{
          fontSize: 'clamp(72px, 16vw, 200px)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          color: '#fff',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}>
          CAREERS
        </span>
      </div>

      {/* Bubbles layer */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {BUBBLES.map(b => (
          <div
            key={b.id}
            data-depth={b.id === 'video' || b.id === 'dark-glass' ? '1.4' : b.id === 'wireframe' ? '0.6' : '1'}
            style={{
              position: 'absolute',
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              borderRadius: '50%',
              overflow: 'hidden',
              animation: `bubbleFloat ${b.dur}s ease-in-out ${b.delay}s infinite`,
              transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
              willChange: 'transform',
              flexShrink: 0,
            }}
          >
            <BubbleContent type={b.type} videoSrc={videoSrc} />
          </div>
        ))}
      </div>

      {/* Gradient fade bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 160,
        background: 'linear-gradient(to bottom, transparent, #000)',
        zIndex: 3,
        pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes bubbleFloat {
          0%, 100% { margin-top: 0px; }
          50%       { margin-top: -18px; }
        }
      `}</style>
    </div>
  );
}

function BubbleContent({ type, videoSrc }: { type: string; videoSrc?: string }) {
  const fill: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };

  if (type === 'video') {
    return videoSrc ? (
      <video src={videoSrc} autoPlay muted loop playsInline style={fill} />
    ) : (
      /* Placeholder when no video provided */
      <div style={{
        ...fill,
        background: 'radial-gradient(circle at 40% 30%, #1e293b, #0f172a)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        color: '#64748b',
        fontSize: 12,
        fontWeight: 600,
        textAlign: 'center',
        padding: 20,
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="#3b82f6" stroke="none"/>
        </svg>
        Drop your video here
      </div>
    );
  }

  if (type === 'glossy-white') return (
    <div style={{ ...fill, background: 'radial-gradient(circle at 35% 28%, #ffffff, #b0b8c8)', boxShadow: 'inset -6px -8px 20px rgba(0,0,0,0.25)' }} />
  );

  if (type === 'wireframe') return (
    <div style={{ ...fill, background: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
      <svg viewBox="0 0 130 130" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        {/* Horizontal lines of a globe */}
        {[0.15,0.28,0.40,0.50,0.60,0.72,0.85].map((ry, i) => {
          const cy = 65, r = 60;
          const y = cy - r + ry * 2 * r;
          const rx = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
          return <ellipse key={i} cx="65" cy={y} rx={rx * 0.98} ry={rx * 0.18} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" />;
        })}
        {/* Vertical lines */}
        {[0,30,60,90,120,150].map((angle, i) => (
          <ellipse key={i} cx="65" cy="65" rx="60" ry={Math.abs(Math.cos((angle * Math.PI) / 180)) * 60 + 2}
            fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8"
            transform={`rotate(${angle} 65 65)`} />
        ))}
        <circle cx="65" cy="65" r="60" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
      </svg>
    </div>
  );

  if (type === 'glossy-purple') return (
    <div style={{ ...fill, background: 'radial-gradient(circle at 38% 30%, #a78bfa, #4c1d95)', boxShadow: 'inset -4px -6px 14px rgba(0,0,0,0.4)' }}>
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
    </div>
  );

  if (type === 'dark-glass') return (
    <div style={{ ...fill, background: 'radial-gradient(circle at 30% 25%, rgba(99,102,241,0.3), rgba(0,0,0,0.95))', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.08)' }} />
  );

  if (type === 'code') return (
    <div style={{ ...fill, background: '#080c14', padding: '18px 16px', overflow: 'hidden' }}>
      <pre style={{ color: '#64748b', fontSize: 10, lineHeight: 1.7, fontFamily: 'monospace', margin: 0, whiteSpace: 'pre-wrap' }}>{`<section class="hero">
  {%- for block in
    section.blocks -%}
  {%- if block.type
    == "slide" -%}
  <div class="slide"
    id="{{ block.id }}">
  {{block.settings
    .heading}}
  </div>
  {%- endif -%}
  {%- endfor -%}
</section>`}</pre>
    </div>
  );

  if (type === 'iridescent') return (
    <div style={{ ...fill, background: 'conic-gradient(from 180deg, #6366f1, #06b6d4, #8b5cf6, #3b82f6, #6366f1)', opacity: 0.9 }}>
      <div style={{ ...fill, background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.25), transparent 60%)' }} />
    </div>
  );

  if (type === 'wireframe-sm') return (
    <div style={{ ...fill, background: '#050505', border: '1px solid rgba(255,255,255,0.12)' }}>
      <svg viewBox="0 0 88 88" width="100%" height="100%">
        {[0.2,0.4,0.6,0.8].map((ry, i) => {
          const cy = 44, r = 40, y = cy - r + ry * 2 * r;
          const rx = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
          return <ellipse key={i} cx="44" cy={y} rx={rx} ry={rx * 0.2} fill="none" stroke="rgba(99,102,241,0.6)" strokeWidth="0.8" />;
        })}
        {[0,45,90,135].map((a, i) => (
          <ellipse key={i} cx="44" cy="44" rx="40" ry={Math.abs(Math.cos(a * Math.PI / 180)) * 40 + 1}
            fill="none" stroke="rgba(99,102,241,0.6)" strokeWidth="0.8" transform={`rotate(${a} 44 44)`} />
        ))}
        <circle cx="44" cy="44" r="40" fill="none" stroke="rgba(99,102,241,0.8)" strokeWidth="0.8" />
      </svg>
    </div>
  );

  if (type === 'dot-globe') return (
    <div style={{ ...fill, background: '#030712', position: 'relative' }}>
      <svg viewBox="0 0 162 162" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 18 }, (_, row) =>
          Array.from({ length: 28 }, (_, col) => {
            const lat = (row / 17) * Math.PI - Math.PI / 2;
            const lon = (col / 27) * 2 * Math.PI;
            const r = 72;
            const x = 81 + r * Math.cos(lat) * Math.cos(lon);
            const y = 81 - r * Math.sin(lat);
            const scale = Math.cos(lat);
            if (scale < 0.1) return null;
            return <circle key={`${row}-${col}`} cx={x} cy={y} r={0.9} fill={row < 9 ? 'rgba(16,185,129,0.7)' : 'rgba(59,130,246,0.6)'} />;
          })
        )}
        <circle cx="81" cy="81" r="72" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      </svg>
    </div>
  );

  return <div style={{ ...fill, background: '#111' }} />;
}
