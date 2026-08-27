'use client';
import { Lock } from 'lucide-react';

/**
 * Full-page "sign in to view this" gate — used by /jobs, /courses,
 * /roadmaps and /mock-interview so logged-out visitors see a consistent
 * locked prompt instead of the page's real content. Pair with useUser()
 * and an <AuthModal> in the page itself:
 *
 *   const { user, loading } = useUser();
 *   const [authOpen, setAuthOpen] = useState(false);
 *   ...
 *   {loading ? <Spinner /> : !user ? (
 *     <SignInGate description="…" onSignIn={() => setAuthOpen(true)} />
 *   ) : ( ...real content... )}
 *   <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" />
 */
export default function SignInGate({
  description,
  accent = '#2563eb',
  accentBg = '#eff6ff',
  onSignIn,
}: {
  description: string;
  accent?: string;
  accentBg?: string;
  onSignIn: () => void;
}) {
  return (
    <div className="card" style={{ padding: '56px 24px', textAlign: 'center', maxWidth: 460, margin: '0 auto' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, margin: '0 auto 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', background: accentBg,
      }}>
        <Lock size={20} style={{ color: accent }} />
      </div>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Sign in to continue</h2>
      <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 22 }}>
        {description}
      </p>
      <button onClick={onSignIn} className="btn btn-blue" style={{ gap: 6, display: 'inline-flex', alignItems: 'center' }}>
        <Lock size={14} /> Sign in to continue
      </button>
    </div>
  );
}
