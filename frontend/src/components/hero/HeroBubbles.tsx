'use client';
import { useEffect, useRef } from 'react';

// ALL bubbles sit exactly on the orbital ellipse:
// cx=50%, cy=50%, a=40%, b=30%
// x = 50 + 40·sin(θ),  y = 50 − 30·cos(θ)
// 8 bubbles at 45° spacing, 22.5° offset → no bubble at exact top/bottom/sides
//
// θ=22.5°  → (65, 22)  upper-right
// θ=67.5°  → (87, 39)  right-upper
// θ=112.5° → (87, 61)  right-lower
// θ=157.5° → (65, 78)  lower-right
// θ=202.5° → (35, 78)  lower-left
// θ=247.5° → (13, 61)  left-lower
// θ=292.5° → (13, 39)  left-upper
// θ=337.5° → (35, 22)  upper-left

const BUBBLES = [
  { id: 'company',    size: 130, x: 65, y: 22, depth: 1.0, delay: 1.5, dur: 7.8, side: false },
  { id: 'purple-sm',  size: 84,  x: 87, y: 39, depth: 0.8, delay: 2.2, dur: 6.4, side: true  },
  { id: 'roadmap',    size: 132, x: 87, y: 61, depth: 1.0, delay: 0.6, dur: 7.4, side: false },
  { id: 'globe',      size: 150, x: 65, y: 78, depth: 0.9, delay: 1.0, dur: 8.4, side: false },
  { id: 'code',       size: 155, x: 35, y: 78, depth: 1.2, delay: 0.4, dur: 6.8, side: false },
  { id: 'iridescent', size: 112, x: 13, y: 61, depth: 0.9, delay: 1.8, dur: 8.8, side: false },
  { id: 'resume',     size: 162, x: 13, y: 39, depth: 1.3, delay: 0,   dur: 7.0, side: false },
  { id: 'glass-acc',  size: 80,  x: 35, y: 22, depth: 0.8, delay: 2.6, dur: 9.0, side: true  },
];

export default function HeroBubbles({ videoSrc }: { videoSrc?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const onMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width  - 0.5;
      const my = (e.clientY - rect.top)  / rect.height - 0.5;
      wrap.querySelectorAll<HTMLElement>('[data-depth]').forEach(el => {
        const d = parseFloat(el.dataset.depth || '1');
        el.style.transform = `translate(-50%, -50%) translate(${mx * d * 22}px, ${my * d * 13}px)`;
      });
    };

    wrap.addEventListener('mousemove', onMove);
    return () => wrap.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <>
      <div ref={wrapRef} className="hero-bubbles-wrap" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>

        {/* ── Orbital path ── */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <defs>
            <filter id="orbit-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#818cf8" stopOpacity="0.5" />
              <stop offset="30%"  stopColor="#a5b4fc" stopOpacity="0.85" />
              <stop offset="60%"  stopColor="#c4b5fd" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.5" />
            </linearGradient>
            {/* Particle filter for glow dots */}
            <filter id="dot-glow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Soft wide halo band */}
          <ellipse cx="50%" cy="50%" rx="40%" ry="30%"
            fill="none"
            stroke="rgba(165,180,255,0.10)"
            strokeWidth="22"
            style={{ filter: 'blur(14px)' }}
          />

          {/* Main dashed orbit ring */}
          <ellipse cx="50%" cy="50%" rx="40%" ry="30%"
            fill="none"
            stroke="url(#orbit-grad)"
            strokeWidth="1.4"
            strokeDasharray="7 12"
            filter="url(#orbit-blur)"
            opacity="0.85"
          />

          {/* Solid thin inner ring for crispness */}
          <ellipse cx="50%" cy="50%" rx="40%" ry="30%"
            fill="none"
            stroke="rgba(165,180,252,0.35)"
            strokeWidth="0.6"
          />
        </svg>

        {BUBBLES.map(b => (
          <div
            key={b.id}
            data-depth={b.depth}
            className={b.side ? 'bubble-side' : undefined}
            style={{
              position: 'absolute',
              left: `${b.x}%`,
              top: `${b.y}%`,
              transform: 'translate(-50%, -50%)',
              transition: 'transform 0.48s cubic-bezier(0.16,1,0.3,1)',
              willChange: 'transform',
              pointerEvents: 'none',
              filter: b.depth < 0.8 ? 'blur(0.8px)' : 'none',
              opacity: b.depth < 0.8 ? 0.88 : 1,
            }}
          >
            <div
              className="hero-bubble"
              style={{
                position: 'relative',
                width: b.size,
                height: b.size,
                borderRadius: '50%',
                overflow: 'hidden',
                animation: `heroBubbleFloat ${b.dur}s ease-in-out ${b.delay}s infinite`,
                isolation: 'isolate',
                // ── Water-glass material ──
                backdropFilter: 'blur(20px) saturate(1.3)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
                background: 'radial-gradient(circle at 35% 30%, rgba(210,218,255,0.48), rgba(195,208,255,0.14) 55%, rgba(180,200,255,0.06))',
                border: '1.5px solid rgba(255,255,255,0.75)',
                boxShadow: [
                  'inset 0 2px 1px rgba(255,255,255,0.90)',
                  'inset 0 -1.5px 4px rgba(160,180,255,0.12)',
                  `0 ${b.depth > 1 ? 24 : 14}px ${b.depth > 1 ? 70 : 38}px rgba(99,102,241,0.13)`,
                  '0 0 48px 4px rgba(180,190,255,0.07)',
                ].join(', '),
              }}
            >
              <BubbleContent id={b.id} videoSrc={videoSrc} />

              {/* ── Glass highlights ── */}
              {/* Large soft crescent — main light source */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
                background: 'radial-gradient(ellipse 74% 52% at 30% 22%, rgba(255,255,255,0.58) 0%, transparent 65%)',
              }} />
              {/* Bright specular dot */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
                background: 'radial-gradient(circle 24% at 26% 18%, rgba(255,255,255,0.72) 0%, transparent 58%)',
              }} />
              {/* Bottom rim reflection */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
                background: 'radial-gradient(ellipse 58% 26% at 65% 90%, rgba(200,215,255,0.22) 0%, transparent 70%)',
              }} />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes heroBubbleFloat {
          0%, 100% { margin-top: 0px; }
          50%       { margin-top: -16px; }
        }
      `}</style>
    </>
  );
}

function BubbleContent({ id, videoSrc }: { id: string; videoSrc?: string }) {
  const fill: React.CSSProperties = { width: '100%', height: '100%' };

  /* ── Resume ── */
  if (id === 'resume') return (
    <div style={{ ...fill, background: 'linear-gradient(145deg, rgba(219,228,255,0.55), rgba(200,215,255,0.25))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {/* Document card */}
      <div style={{ width: 64, height: 82, background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(180,196,255,0.5)', borderRadius: 8, padding: '10px 9px', display: 'flex', flexDirection: 'column', gap: 4.5, boxShadow: '0 4px 16px rgba(99,102,241,0.12)' }}>
        {/* Avatar circle + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ height: 3, width: '80%', background: 'rgba(30,41,59,0.7)', borderRadius: 2 }} />
            <div style={{ height: 2, width: '55%', background: 'rgba(99,102,241,0.5)', borderRadius: 2 }} />
          </div>
        </div>
        <div style={{ height: 0.75, background: 'rgba(148,163,184,0.25)', margin: '1px 0' }} />
        {[82, 68, 72, 60, 65].map((w, i) => (
          <div key={i} style={{ height: 2.5, width: `${w}%`, background: `rgba(100,116,139,${i === 0 ? 0.55 : 0.35})`, borderRadius: 2 }} />
        ))}
        <div style={{ height: 0.75, background: 'rgba(148,163,184,0.25)', margin: '1px 0' }} />
        {[75, 62].map((w, i) => (
          <div key={i} style={{ height: 2.5, width: `${w}%`, background: 'rgba(100,116,139,0.3)', borderRadius: 2 }} />
        ))}
      </div>
      <div style={{ color: 'rgba(79,86,180,0.85)', fontSize: 8, fontWeight: 700, letterSpacing: 2.5 }}>RESUME</div>
    </div>
  );

  /* ── Purple small accent ── */
  if (id === 'purple-sm') return (
    <div style={{ ...fill, background: 'radial-gradient(circle at 38% 30%, rgba(167,139,250,0.75), rgba(109,40,217,0.55), rgba(46,16,101,0.5))' }} />
  );

  /* ── Company logos ── */
  if (id === 'company') return (
    <div style={{ ...fill, background: 'linear-gradient(145deg, rgba(224,231,255,0.5), rgba(210,220,255,0.22))', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 10, padding: '20px 22px' }}>
      {[
        { name: 'Google',  color: '#4285F4', dot: ['#4285F4','#EA4335','#FBBC04','#34A853'] },
        { name: 'amazon',  color: '#FF9900', dot: ['#FF9900'] },
        { name: 'TCS',     color: '#1e40af', dot: ['#1e40af'] },
      ].map(({ name, color, dot }) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Brand dot(s) */}
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(180,196,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {dot.length > 1 ? (
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle cx="4" cy="4" r="2.5" fill="#4285F4"/>
                <circle cx="8" cy="4" r="2.5" fill="#EA4335"/>
                <circle cx="4" cy="8" r="2.5" fill="#34A853"/>
                <circle cx="8" cy="8" r="2.5" fill="#FBBC04"/>
              </svg>
            ) : (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            )}
          </div>
          <span style={{ fontSize: name === 'TCS' ? 12 : 13, fontWeight: 700, color: color, fontFamily: 'system-ui, sans-serif', letterSpacing: name === 'amazon' ? -0.3 : 0 }}>{name}</span>
        </div>
      ))}
    </div>
  );

  /* ── Glass accent ── */
  if (id === 'glass-acc') return (
    <div style={{ ...fill, background: 'radial-gradient(circle at 38% 32%, rgba(196,181,253,0.65), rgba(124,58,237,0.40))' }} />
  );

  /* ── Globe / dot network (or video if provided) ── */
  if (id === 'globe') return videoSrc ? (
    <video src={videoSrc} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  ) : (
    <div style={{ ...fill, background: 'linear-gradient(145deg, rgba(219,228,255,0.45), rgba(200,215,255,0.18))' }}>
      <svg viewBox="0 0 160 160" width="100%" height="100%">
        {Array.from({ length: 14 }, (_, row) =>
          Array.from({ length: 22 }, (_, col) => {
            const lat = (row / 13) * Math.PI - Math.PI / 2;
            const lon = (col / 21) * 2 * Math.PI;
            const r = 66; const x = 80 + r * Math.cos(lat) * Math.cos(lon); const y = 80 - r * Math.sin(lat);
            const s = Math.cos(lat); if (s < 0.08) return null;
            return <circle key={`${row}-${col}`} cx={x} cy={y} r={1.1} fill={`rgba(99,102,241,${(0.2 + s * 0.45).toFixed(2)})`} />;
          })
        )}
        {[0,30,60,90,120,150].map((a, i) => (
          <ellipse key={i} cx="80" cy="80" rx="66" ry={Math.abs(Math.cos(a * Math.PI/180)) * 66 + 0.5}
            fill="none" stroke="rgba(99,102,241,0.18)" strokeWidth="0.7" transform={`rotate(${a} 80 80)`}/>
        ))}
        <circle cx="80" cy="80" r="66" fill="none" stroke="rgba(99,102,241,0.28)" strokeWidth="0.8"/>
      </svg>
    </div>
  );

  /* ── Roadmap ── */
  if (id === 'roadmap') return (
    <div style={{ ...fill, background: 'linear-gradient(145deg, rgba(209,250,229,0.55), rgba(167,243,208,0.28), rgba(6,182,212,0.18))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <svg width="80" height="52" viewBox="0 0 80 52">
        {/* Glow */}
        <polyline points="6,42 20,26 34,33 50,14 64,22 74,10"
          fill="none" stroke="rgba(16,185,129,0.25)" strokeWidth="9"
          strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'blur(4px)' }} />
        {/* Line */}
        <polyline points="6,42 20,26 34,33 50,14 64,22 74,10"
          fill="none" stroke="rgba(5,150,105,0.85)" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round" />
        {([[6,42],[34,33],[64,22],[74,10]] as [number,number][]).map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r={3.2} fill="#10b981" stroke="rgba(255,255,255,0.8)" strokeWidth="1"/>
        ))}
      </svg>
      <div style={{ color: 'rgba(6,95,70,0.9)', fontSize: 9, fontWeight: 700, letterSpacing: 2.2 }}>ROADMAP</div>
    </div>
  );

  /* ── Iridescent ── */
  if (id === 'iridescent') return (
    <div style={{ ...fill, background: 'conic-gradient(from 200deg, #a5b4fc, #6ee7b7, #c4b5fd, #93c5fd, #a5b4fc)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 36% 30%, rgba(255,255,255,0.35), transparent 55%)' }} />
    </div>
  );

  /* ── Code terminal ── */
  if (id === 'code') return (
    <div style={{ ...fill, background: 'linear-gradient(145deg, rgba(219,228,255,0.45), rgba(200,215,255,0.20))', padding: '14px 13px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 7 }}>
        {['rgba(255,95,87,0.7)','rgba(255,189,46,0.7)','rgba(40,200,64,0.7)'].map(c => (
          <div key={c} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
        ))}
      </div>
      <pre style={{ color: 'rgba(67,56,202,0.75)', fontSize: 8.5, lineHeight: 1.75, fontFamily: 'monospace', margin: 0, whiteSpace: 'pre-wrap' }}>{`function getJob() {
  const skills =
    ["React","Node"];
  const resume =
    optimise(cv);
  return apply({
    skills, resume,
    via: "TechHub"
  });
}`}</pre>
    </div>
  );

  /* ── Glass accent ── */
  if (id === 'glass-acc') return (
    <div style={{ ...fill, background: 'radial-gradient(circle at 38% 32%, rgba(196,181,253,0.65), rgba(124,58,237,0.38))' }} />
  );

  return <div style={{ ...fill, background: 'rgba(200,215,255,0.25)' }} />;
}
