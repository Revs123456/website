export default function MaintenancePage({ title, message }: { title: string; message: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🔧</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>{title}</h1>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7 }}>{message}</p>
      </div>
    </div>
  );
}
