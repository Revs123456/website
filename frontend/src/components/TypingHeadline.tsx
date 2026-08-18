'use client';
import { useEffect, useState } from 'react';

export default function TypingHeadline({ line1, line2 }: { line1?: string; line2?: string }) {
  const LINE1 = line1 || 'Land your first tech job';
  const LINE2 = line2 || 'faster with a proven roadmap';

  const [displayed1, setDisplayed1] = useState('');
  const [displayed2, setDisplayed2] = useState('');
  const [phase, setPhase] = useState<'line1' | 'line2' | 'done'>('line1');
  const [showCursor, setShowCursor] = useState(true);

  // Type line 1
  useEffect(() => {
    if (phase !== 'line1') return;
    if (displayed1.length < LINE1.length) {
      const t = setTimeout(() => setDisplayed1(LINE1.slice(0, displayed1.length + 1)), 50);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setPhase('line2'), 180);
      return () => clearTimeout(t);
    }
  }, [displayed1, phase, LINE1]);

  // Type line 2
  useEffect(() => {
    if (phase !== 'line2') return;
    if (displayed2.length < LINE2.length) {
      const t = setTimeout(() => setDisplayed2(LINE2.slice(0, displayed2.length + 1)), 50);
      return () => clearTimeout(t);
    } else {
      setPhase('done');
    }
  }, [displayed2, phase, LINE2]);

  // Blink cursor
  useEffect(() => {
    const t = setInterval(() => setShowCursor(v => !v), 530);
    return () => clearInterval(t);
  }, []);

  const cursorEl = (
    <span style={{
      display: 'inline-block',
      width: 3,
      height: '1em',
      background: '#2563eb',
      marginLeft: 3,
      verticalAlign: 'middle',
      borderRadius: 2,
      opacity: showCursor ? 1 : 0,
      transition: 'opacity 0.1s',
    }} />
  );

  return (
    <h1
      className="text-display anim-fade-up d-2"
      style={{ marginBottom: 22, fontSize: 'clamp(2rem, 4vw, 3.5rem)', textAlign: 'left' }}
    >
      {/* Line 1 */}
      <span>
        {displayed1.slice(0, 16)}
        {displayed1.length > 16 && <span className="grad-blue">{displayed1.slice(16)}</span>}
        {phase === 'line1' && cursorEl}
      </span>

      {/* Line 2 */}
      {displayed2.length > 0 && (
        <>
          <br />
          <span>{displayed2}</span>
          {phase !== 'line1' && cursorEl}
        </>
      )}
    </h1>
  );
}
