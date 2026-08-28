'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Loader2, Send, Mic, AlertCircle, Lock, Sparkles, Trophy } from 'lucide-react';
import { userApi, type MockInterviewSession } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import AuthModal from '@/components/AuthModal';

type Turn = { role: 'user' | 'assistant'; content: string };

/**
 * Mock interview flow:
 *   1. Setup screen — user picks role + company + difficulty
 *   2. Chat screen — multi-turn with streaming AI responses (SSE)
 *   3. User clicks "End interview" → POST /complete → push to /mock-interview/[token]
 */
export default function MockInterviewPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [session, setSession] = useState<MockInterviewSession | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [startError, setStartError] = useState('');

  // Setup form state
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [starting, setStarting] = useState(false);

  async function startInterview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { setAuthOpen(true); return; }
    if (!role.trim()) return;
    setStartError(''); setStarting(true);
    try {
      const s = await userApi.startMockInterview({
        role: role.trim(),
        company: company.trim() || undefined,
        difficulty,
      });
      setSession(s);
    } catch (err: any) {
      setStartError(err.message || 'Could not start interview');
    } finally {
      setStarting(false);
    }
  }

  // If session active → render chat
  if (session) return <ChatScreen session={session} onComplete={(token) => router.push(`/mock-interview/${token}`)} />;

  // Setup screen
  return (
    <div style={{ maxWidth: 580, margin: '0 auto', padding: '96px 24px 60px' }}>
      <Hero />

      <form onSubmit={startInterview} className="card" style={{ padding: 26 }}>
        <Field label="Role you're interviewing for *">
          <input
            className="input"
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="Senior Backend Engineer"
            required
            maxLength={80}
          />
        </Field>

        <Field label="Company (optional)">
          <input
            className="input"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="e.g. Razorpay, Google, Swiggy"
            maxLength={80}
          />
        </Field>

        <Field label="Difficulty">
          <div style={{ display: 'flex', gap: 8 }}>
            {(['easy', 'medium', 'hard'] as const).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${difficulty === d ? '#2563eb' : '#e2e8f0'}`,
                  background: difficulty === d ? '#eff6ff' : '#fff',
                  color: '#0f172a', fontSize: 13, fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </Field>

        {startError && (
          <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#dc2626', display: 'flex', gap: 8 }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{startError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={starting || (!role.trim() && !!user)}
          className="btn btn-blue"
          style={{ width: '100%', justifyContent: 'center', marginTop: 18, opacity: (starting || (!role.trim() && !!user)) ? 0.6 : 1 }}
        >
          {starting ? <Loader2 size={14} className="spin" /> : !user ? <Lock size={14} /> : <MessageSquare size={14} />}
          {starting ? 'Starting…' : !user ? 'Sign in to start' : 'Start interview'}
        </button>

        {!userLoading && !user && (
          <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>
            Free tier: 1 mock interview / month · Pro: unlimited
          </p>
        )}
      </form>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" />
      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}

// ── Chat screen ─────────────────────────────────────────────────────────────
function ChatScreen({ session, onComplete }: { session: MockInterviewSession; onComplete: (token: string) => void }) {
  const [turns, setTurns] = useState<Turn[]>([{ role: 'assistant', content: session.first_question }]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  async function sendMessage() {
    const msg = input.trim();
    if (!msg || streaming) return;
    setInput(''); setError('');

    // Add user turn + empty assistant turn we'll stream into
    setTurns(t => [...t, { role: 'user', content: msg }, { role: 'assistant', content: '' }]);
    setStreaming(true);

    try {
      for await (const event of userApi.streamMockInterviewMessage(session.id, msg)) {
        if (event.type === 'text') {
          setTurns(t => {
            const next = [...t];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
              next[next.length - 1] = { ...last, content: last.content + event.delta };
            }
            return next;
          });
        } else if (event.type === 'error') {
          throw new Error(event.message || 'Stream error');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Connection lost');
      // Roll back the empty assistant placeholder if nothing was streamed
      setTurns(t => t[t.length - 1]?.role === 'assistant' && t[t.length - 1].content === '' ? t.slice(0, -1) : t);
    } finally {
      setStreaming(false);
    }
  }

  async function endInterview() {
    setCompleting(true);
    try {
      const res = await userApi.completeMockInterview(session.id);
      onComplete(res.share_token);
    } catch (err: any) {
      setError(err.message || 'Could not end interview');
      setCompleting(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '96px 24px 24px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 0px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {session.role}{session.company ? ` · ${session.company}` : ''}
            </h1>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0', textTransform: 'capitalize' }}>
              {session.difficulty} difficulty
            </p>
          </div>
          <button
            onClick={endInterview}
            disabled={completing || streaming || turns.length < 4}
            className="btn btn-outline btn-sm"
            style={{ opacity: (completing || streaming || turns.length < 4) ? 0.6 : 1 }}
            title={turns.length < 4 ? 'Answer at least 2 questions before ending' : ''}
          >
            {completing ? <Loader2 size={12} className="spin" /> : <Trophy size={12} />}
            {completing ? 'Evaluating…' : 'End & evaluate'}
          </button>
        </div>
      </div>

      {/* Chat scroll */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {turns.map((t, i) => (
          <Bubble key={i} turn={t} isLast={i === turns.length - 1 && streaming} />
        ))}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <AlertCircle size={13} /><span>{error}</span>
        </div>
      )}

      {/* Input */}
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
        <form onSubmit={e => { e.preventDefault(); sendMessage(); }} style={{ display: 'flex', gap: 8 }}>
          <textarea
            className="input"
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 4000))}
            placeholder="Type your answer…  (Shift+Enter for newline, Enter to send)"
            disabled={streaming}
            rows={3}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            style={{ resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="btn btn-blue"
            style={{ alignSelf: 'flex-end', opacity: (streaming || !input.trim()) ? 0.5 : 1, padding: '10px 16px' }}
          >
            {streaming ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
          </button>
        </form>
      </div>

      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}

function Bubble({ turn, isLast }: { turn: Turn; isLast: boolean }) {
  const isUser = turn.role === 'user';
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'linear-gradient(135deg,#2563eb,var(--brand-violet))' : '#f1f5f9',
        color: isUser ? '#fff' : '#475569',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
      }}>
        {isUser ? 'You' : 'AI'}
      </div>
      <div style={{
        maxWidth: 'calc(100% - 64px)',
        background: isUser ? '#eff6ff' : '#fff',
        border: `1px solid ${isUser ? '#bfdbfe' : '#e2e8f0'}`,
        borderRadius: 14,
        padding: '12px 14px',
        fontSize: 14, color: '#0f172a', lineHeight: 1.6,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {turn.content || (isLast && <Loader2 size={14} className="spin" style={{ color: '#94a3b8' }} />)}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <span className="badge badge-violet" style={{ marginBottom: 12 }}>
        <Mic size={11} style={{ marginRight: 3 }} /> AI MOCK INTERVIEW
      </span>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
        Practice with an AI interviewer
      </h1>
      <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
        Adaptive questions for any role. Scored feedback at the end. Shareable result card.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
