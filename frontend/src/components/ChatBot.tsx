'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle, X, Send, Mic, Briefcase, BookOpen, Map,
  FileText, Users, TrendingUp, Mail, Mic2, MinusCircle,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */
type Message = { id: number; from: 'bot' | 'user'; text: string; time: string };

/* ─── FAQ data ───────────────────────────────────────────── */
const FAQS: { patterns: string[]; answer: string }[] = [
  { patterns: ['job', 'jobs', 'hiring', 'openings', 'vacancy', 'apply'],         answer: 'Browse all current job openings on our **Jobs** page at /jobs. We update listings daily from top companies!' },
  { patterns: ['course', 'courses', 'learn', 'learning', 'tutorial', 'training'], answer: 'Check out our **Courses** page at /courses — curated programs for web dev, data science, cloud, and more.' },
  { patterns: ['roadmap', 'roadmaps', 'career path', 'path', 'guide', 'plan'],    answer: 'Our **Roadmaps** at /roadmaps offer step-by-step learning paths for frontend, backend, DevOps, AI, and more.' },
  { patterns: ['interview', 'mock interview', 'interview questions'],              answer: 'Prepare with our **Mock Interview** at /mock-interview or browse common **Interview Questions** at /interview-questions.' },
  { patterns: ['mentor', 'mentorship', 'service', 'coaching', '1:1'],             answer: 'We offer 1:1 mentorship & career coaching. Explore **Services** at /services or book at /book.' },
  { patterns: ['salary', 'pay', 'compensation', 'wage', 'ctc'],                   answer: 'Explore **Salary Insights** at /salary-insights — compare pay across roles, companies, and cities.' },
  { patterns: ['community', 'forum', 'connect', 'network'],                       answer: 'Join our **Community** at /community — connect with peers, share wins, and grow together.' },
  { patterns: ['blog', 'blogs', 'article', 'read', 'post'],                       answer: 'Read career guides and tech deep-dives on our **Blog** at /blogs.' },
  { patterns: ['contact', 'reach', 'support', 'help', 'email'],                  answer: 'Reach us via the **Contact** page at /contact. We reply within 24 hours.' },
  { patterns: ['template', 'templates', 'resume template'],                       answer: 'Download ATS-ready **Resume Templates** at /templates — built to impress recruiters.' },
  { patterns: ['tip', 'tips', 'daily tip'],                                        answer: 'Get bite-sized daily advice on our **Daily Tips** page at /daily-tips.' },
  { patterns: ['success', 'success story', 'placed', 'got job'],                  answer: 'Get inspired by real placement stories at /success-stories!' },
  { patterns: ['hi', 'hello', 'hey', 'hii', 'howdy'],                             answer: "Hi there! 👋 I'm your **Tech Career Hub** assistant. Ask me about jobs, courses, roadmaps, resume tips, interviews, or mentorship." },
  { patterns: ['bye', 'goodbye', 'thanks', 'thank you'],                          answer: "You're welcome! Best of luck on your tech career journey. Come back anytime! 🚀" },
];

const QUICK_ACTIONS = [
  { icon: Briefcase, label: 'Jobs',      query: 'Find jobs' },
  { icon: BookOpen,  label: 'Courses',   query: 'Explore courses' },
  { icon: Map,       label: 'Roadmaps',  query: 'Career roadmaps' },
  { icon: FileText,  label: 'ATS Check', query: 'ATS checker' },
  { icon: Mic2,      label: 'Interview', query: 'Mock interview' },
  { icon: Users,     label: 'Community', query: 'Join community' },
  { icon: TrendingUp,label: 'Salary',    query: 'Salary insights' },
  { icon: Mail,      label: 'Contact',   query: 'Contact us' },
];

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getBotReply(input: string): string {
  const q = input.toLowerCase();
  for (const faq of FAQS) {
    if (faq.patterns.some(p => q.includes(p))) return faq.answer;
  }
  return "I'm not sure about that, but feel free to visit our **Contact** page at /contact and we'll help you out!";
}

function Bubble({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? <strong key={i}>{p}</strong> : p
      )}
    </>
  );
}

let uid = 1;

/* ─── Component ─────────────────────────────────────────── */
export default function ChatBot() {
  const [open, setOpen]       = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: uid++, from: 'bot', time: now(),
    text: "Hi! 👋 I'm your **Tech Career Hub** assistant. How can I help you today? Pick a topic or type your question below.",
  }]);
  const [input,   setInput]   = useState('');
  const [typing,  setTyping]  = useState(false);
  const [unread,  setUnread]  = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  /* mount/unmount animation gate */
  useEffect(() => {
    if (open) {
      setMounted(true);
      setUnread(false);
    } else {
      const t = setTimeout(() => setMounted(false), 280);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 320);
  }, [open]);

  const send = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages(prev => [...prev, { id: uid++, from: 'user', text: t, time: now() }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { id: uid++, from: 'bot', text: getBotReply(t), time: now() }]);
    }, 800);
  }, []);

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') send(input);
  };

  const showQuick = messages.length <= 1;

  /* ── styles (defined once, not inside JSX to stay readable) */
  const S = {
    /* window wrapper */
    window: {
      position: 'fixed' as const,
      bottom: 88,
      right: 24,
      width: 376,
      maxHeight: 580,
      display: 'flex',
      flexDirection: 'column' as const,
      background: '#ffffff',
      borderRadius: 20,
      boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      zIndex: 9999,
      border: '1px solid #f0f0f5',
      transition: 'opacity .28s ease, transform .28s cubic-bezier(.34,1.4,.64,1)',
      opacity:   open ? 1 : 0,
      transform: open ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
      transformOrigin: 'bottom right',
    },
    /* header */
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 16px',
      background: '#ffffff',
      borderBottom: '1px solid #f3f4f6',
      flexShrink: 0,
    },
    avatar: {
      width: 40, height: 40, borderRadius: '50%',
      background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, position: 'relative' as const,
    },
    onlineDot: {
      position: 'absolute' as const, bottom: 1, right: 1,
      width: 11, height: 11, borderRadius: '50%',
      background: '#22c55e', border: '2px solid #fff',
    },
    /* messages area */
    messages: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '20px 16px 12px',
      background: '#fafafa',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 16,
      minHeight: 0,
    },
    botBubble: {
      maxWidth: '80%',
      background: '#ffffff',
      borderRadius: '18px 18px 18px 4px',
      padding: '12px 16px',
      fontSize: 14,
      lineHeight: 1.6,
      color: '#1e293b',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      border: '1px solid #f0f0f5',
    },
    userBubble: {
      maxWidth: '80%',
      background: 'linear-gradient(135deg,#6366f1,#7c3aed)',
      borderRadius: '18px 18px 4px 18px',
      padding: '12px 16px',
      fontSize: 14,
      lineHeight: 1.6,
      color: '#ffffff',
    },
    timestamp: {
      fontSize: 10,
      color: '#cbd5e1',
      marginTop: 4,
    },
    /* typing dots */
    typingWrap: {
      display: 'flex', alignItems: 'center', gap: 5,
      background: '#ffffff',
      borderRadius: '18px 18px 18px 4px',
      padding: '14px 18px',
      width: 68,
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      border: '1px solid #f0f0f5',
    },
    /* quick actions */
    quickWrap: {
      padding: '10px 16px 14px',
      background: '#fafafa',
      flexShrink: 0,
    },
    quickLabel: {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.08em',
      color: '#94a3b8',
      textTransform: 'uppercase' as const,
      marginBottom: 8,
    },
    quickScroll: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto' as const,
      paddingBottom: 2,
      scrollbarWidth: 'none' as const,
    },
    quickChip: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '7px 13px',
      borderRadius: 100,
      border: '1px solid #e2e8f0',
      background: '#ffffff',
      fontSize: 12,
      fontWeight: 500,
      color: '#475569',
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
      flexShrink: 0,
      transition: 'all .18s ease',
    },
    /* input area */
    inputWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '12px 14px',
      background: '#ffffff',
      borderTop: '1px solid #f3f4f6',
      flexShrink: 0,
    },
    input: {
      flex: 1,
      border: '1.5px solid #e2e8f0',
      borderRadius: 100,
      padding: '10px 16px',
      fontSize: 14,
      color: '#1e293b',
      background: '#fafafa',
      outline: 'none',
      transition: 'border-color .2s',
    },
    sendBtn: {
      width: 38, height: 38,
      borderRadius: '50%',
      border: 'none',
      background: 'linear-gradient(135deg,#6366f1,#7c3aed)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'opacity .18s, transform .18s',
    },
    micBtn: {
      width: 36, height: 36,
      borderRadius: '50%',
      border: '1.5px solid #e2e8f0',
      background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
      flexShrink: 0,
      color: '#94a3b8',
      transition: 'background .18s',
    },
    footer: {
      textAlign: 'center' as const,
      fontSize: 10,
      color: '#cbd5e1',
      padding: '6px 0',
      background: '#ffffff',
      flexShrink: 0,
      letterSpacing: '0.02em',
    },
    /* FAB */
    fab: {
      position: 'fixed' as const,
      bottom: 24, right: 24,
      width: 56, height: 56,
      borderRadius: 18,
      border: 'none',
      background: open ? '#f1f5f9' : 'linear-gradient(135deg,#6366f1,#7c3aed)',
      boxShadow: open ? '0 2px 12px rgba(0,0,0,0.1)' : '0 4px 20px rgba(99,102,241,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
      zIndex: 9999,
      transition: 'all .25s cubic-bezier(.34,1.4,.64,1)',
    },
    badge: {
      position: 'absolute' as const,
      top: -4, right: -4,
      width: 18, height: 18,
      background: '#ef4444',
      borderRadius: '50%',
      border: '2px solid #fff',
      fontSize: 10,
      fontWeight: 700,
      color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
  };

  return (
    <>
      {/* ── Chat window ── */}
      {mounted && (
        <div style={S.window}>

          {/* Header */}
          <div style={S.header}>
            <div style={S.avatar}>
              <MessageCircle size={18} color="#fff" strokeWidth={2.2} />
              <span style={S.onlineDot} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Career Assistant</p>
              <p style={{ margin: 0, fontSize: 11, color: '#22c55e', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Online · Replies instantly
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 8, display: 'flex', alignItems: 'center' }}
              title="Close"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          {/* Messages */}
          <div style={S.messages}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={msg.from === 'bot' ? S.botBubble : S.userBubble}>
                  <Bubble text={msg.text} />
                </div>
                <span style={{ ...S.timestamp, textAlign: msg.from === 'user' ? 'right' : 'left' }}>{msg.time}</span>
              </div>
            ))}

            {typing && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={S.typingWrap}>
                  {[0, 160, 320].map(d => (
                    <span key={d} style={{
                      width: 7, height: 7, borderRadius: '50%', background: '#c7d2fe',
                      display: 'inline-block', animation: 'tcb-bounce .9s infinite',
                      animationDelay: `${d}ms`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick action chips */}
          {showQuick && (
            <div style={S.quickWrap}>
              <p style={S.quickLabel}>Quick topics</p>
              <div style={S.quickScroll}>
                {QUICK_ACTIONS.map(({ icon: Icon, label, query }) => (
                  <button
                    key={label}
                    onClick={() => send(query)}
                    style={S.quickChip}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = '#f5f3ff';
                      (e.currentTarget as HTMLElement).style.borderColor = '#c4b5fd';
                      (e.currentTarget as HTMLElement).style.color = '#6366f1';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = '#ffffff';
                      (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                      (e.currentTarget as HTMLElement).style.color = '#475569';
                    }}
                  >
                    <Icon size={13} style={{ flexShrink: 0 }} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input row */}
          <div style={S.inputWrap}>
            <button style={S.micBtn} title="Voice input"
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#f5f3ff')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#fff')}
            >
              <Mic size={15} color="#94a3b8" strokeWidth={2} />
            </button>

            <input
              ref={inputRef}
              style={S.input}
              type="text"
              placeholder="Ask me anything…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              onFocus={e => ((e.target as HTMLElement).style.borderColor = '#a5b4fc')}
              onBlur={e => ((e.target as HTMLElement).style.borderColor = '#e2e8f0')}
            />

            <button
              style={{ ...S.sendBtn, opacity: input.trim() ? 1 : 0.45 }}
              onClick={() => send(input)}
              disabled={!input.trim()}
              onMouseEnter={e => { if (input.trim()) (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              <Send size={15} color="#fff" strokeWidth={2.2} style={{ transform: 'translateX(1px)' }} />
            </button>
          </div>

          <div style={S.footer}>Powered by Tech Career Hub</div>
        </div>
      )}

      {/* ── FAB ── */}
      <button
        style={S.fab}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle chat"
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.transform = 'scale(1.08) translateY(-2px)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      >
        {open
          ? <X size={22} color="#64748b" strokeWidth={2} />
          : <MessageCircle size={22} color="#fff" strokeWidth={2} />}
        {unread && !open && <span style={S.badge}>1</span>}
      </button>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes tcb-bounce {
          0%,80%,100% { transform: translateY(0); }
          40%          { transform: translateY(-5px); }
        }
        @media (max-width: 480px) {
          [data-chatbot-window] {
            right: 0 !important;
            bottom: 80px !important;
            width: 100vw !important;
            border-radius: 20px 20px 0 0 !important;
            max-height: 75vh !important;
          }
        }
      `}</style>
    </>
  );
}
