'use client';

const shimmer = {
  background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
} as React.CSSProperties;

export default function AdminSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 0',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div style={{ ...shimmer, width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ ...shimmer, height: 14, borderRadius: 4, width: `${55 + (i % 3) * 15}%` }} />
            <div style={{ ...shimmer, height: 12, borderRadius: 4, width: `${30 + (i % 4) * 10}%` }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ ...shimmer, width: 60, height: 28, borderRadius: 6 }} />
            <div style={{ ...shimmer, width: 60, height: 28, borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
