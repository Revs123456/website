'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bot, Send, Loader2, AlertCircle, Lock, Sparkles } from 'lucide-react';
import { userApi } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import AuthModal from '@/components/AuthModal';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTED_PROMPTS = [
  'How do I prepare for a system design interview in 2 weeks?',
  'What\'s a fair salary for a 3-yoe backend engineer in Bangalore?',
  'I have an offer but feel underpaid — how do I negotiate?',
  'Frontend or backend — which is better for AI/ML transition?',
];

export default function RevBotPage() {
  const { user, loading: userLoading } = useUser();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send(messageText?: string) {
    const text = (messageText ?? input).trim();
    if (!text || streaming) return;
    if (!user) { setAuthOpen(true); return; }

    setInput(''); setError('');
    const nextMessages: Msg[] = [...messages, { role: 'user', content: text }, { role: 'assistant', content: '' }];
    setMessages(nextMessages);
    setStreaming(true);

    try {
      // Send all previous turns + new user message (assistant placeholder excluded)
      const historyToSend = nextMessages.slice(0, -1);
      for await (const event of userApi.streamRevBotChat(historyToSend)) {
        if (event.type === 'text') {
          setMessages(m => {
            const next = [...m];
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
      setMessages(m => m[m.length - 1]?.role === 'assistant' && m[m.length - 1].content === '' ? m.slice(0, -1) : m);
    } finally {
      setStreaming(false);
    }
  }

  const showSuggested = messages.length === 0;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '96px 24px 24px', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 0px)' }}>
      <Header />

      {/* Chat scroll area */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {showSuggested ? (
          <SuggestedPrompts onPick={(p) => send(p)} disabled={!!streaming} />
        ) : (
          messages.map((m, i) => (
            <Bubble key={i} msg={m} isLast={i === messages.length - 1 && streaming} />
          ))
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <AlertCircle size={13} /><span>{error}</span>
        </div>
      )}

      {/* Input */}
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
        <form onSubmit={e => { e.preventDefault(); send(); }} style={{ display: 'flex', gap: 8 }}>
          <textarea
            className="input"
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 4000))}
            placeholder={user ? "Ask about interviews, salaries, learning paths, roles…" : "Sign in to chat with RevBot"}
            disabled={streaming || !user}
            rows={2}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            style={{ resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="btn btn-blue"
            style={{ alignSelf: 'flex-end', opacity: (streaming || !input.trim()) ? 0.5 : 1, padding: '10px 16px' }}
          >
            {streaming ? <Loader2 size={14} className="spin" /> : user ? <Send size={14} /> : <Lock size={14} />}
          </button>
        </form>
        {!userLoading && !user && (
          <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
            Free tier: 10 messages/day · Pro: unlimited
          </p>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" />
      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}

function Header() {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bot size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            RevBot
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
            Your AI career coach — knows the platform, knows your profile
          </p>
        </div>
      </div>
    </div>
  );
}

function SuggestedPrompts({ onPick, disabled }: { onPick: (text: string) => void; disabled: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: 20 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Sparkles size={26} color="#fff" />
      </div>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>What&apos;s on your mind?</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          Ask anything about your tech career. I know the platform, so I can point you to the right tool.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8, width: '100%', maxWidth: 600 }}>
        {SUGGESTED_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => onPick(p)}
            disabled={disabled}
            className="card card-blue"
            style={{ padding: 14, textAlign: 'left', cursor: 'pointer', fontSize: 13, lineHeight: 1.4, color: '#374151', background: '#fff' }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({ msg, isLast }: { msg: Msg; isLast: boolean }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#f1f5f9',
        color: isUser ? '#fff' : '#475569',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
      }}>
        {isUser ? 'You' : <Bot size={16} />}
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
        {msg.content
          ? formatWithLinks(msg.content)
          : (isLast && <Loader2 size={14} className="spin" style={{ color: '#94a3b8' }} />)}
      </div>
    </div>
  );
}

/**
 * Turn `/tools/foo` paths in RevBot replies into clickable links.
 * RevBot is prompted to reference these paths — make them functional.
 */
function formatWithLinks(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\/[a-z][a-z0-9/-]*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <Link key={key++} href={match[1]} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
        {match[1]}
      </Link>,
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}
