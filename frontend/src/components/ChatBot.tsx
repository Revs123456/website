'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Send, Mic, Briefcase, BookOpen, Map,
  Users, TrendingUp, Mail, Mic2,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */
type Suggestion = { label: string; query: string };
type Message = { id: number; from: 'bot' | 'user'; text: string; time: string; suggestions?: Suggestion[] };
type Faq = { id: string; label: string; patterns: string[]; answer: string; followUp?: string };

/* ─── FAQ data ───────────────────────────────────────────── */
const FAQS: Faq[] = [
  {
    id: 'jobs', label: 'Jobs',
    patterns: ['job', 'jobs', 'hiring', 'openings', 'vacancy', 'apply', 'opportunity', 'opportunities'],
    answer: 'Browse all current job openings on our **Jobs** page at /jobs. We update listings daily from top companies!',
    followUp: "You can filter by role, location, and experience level — and once you're signed in, you'll see a personalized match score on each listing. Want help with resumes or interview prep for a specific role?",
  },
  {
    id: 'courses', label: 'Courses',
    patterns: ['course', 'courses', 'learn', 'learning', 'tutorial', 'training', 'certification'],
    answer: 'Check out our **Courses** page at /courses — curated programs for web dev, data science, cloud, and more.',
    followUp: "Not sure where to start? Try the **Roadmaps** at /roadmaps first — they'll point you to the right courses in order.",
  },
  {
    id: 'roadmaps', label: 'Roadmaps',
    patterns: ['roadmap', 'roadmaps', 'career path', 'career plan', 'learning path'],
    answer: 'Our **Roadmaps** at /roadmaps offer step-by-step learning paths for frontend, backend, DevOps, AI, and more.',
  },
  {
    id: 'interview', label: 'Interview prep',
    patterns: ['interview', 'interviews', 'mock interview', 'interview questions'],
    answer: 'Prepare with our **Mock Interview** at /mock-interview or browse common **Interview Questions** at /interview-questions.',
    followUp: 'The mock interview gives scored AI feedback after each session. Want tips for a specific round — technical, HR, or system design?',
  },
  {
    id: 'mentorship', label: 'Mentorship',
    patterns: ['mentor', 'mentors', 'mentorship', 'coaching', '1:1'],
    answer: 'We offer 1:1 mentorship & career coaching. Explore **Services** at /services or book at /book.',
  },
  {
    id: 'salary', label: 'Salary insights',
    patterns: ['salary', 'salaries', 'pay', 'compensation', 'wage', 'ctc', 'package'],
    answer: 'Explore **Salary Insights** at /salary-insights — compare pay across roles, companies, and cities.',
  },
  {
    id: 'community', label: 'Community',
    patterns: ['community', 'forum', 'connect', 'network', 'networking'],
    answer: 'Join our **Community** at /community — connect with peers, share wins, and grow together.',
  },
  {
    id: 'blog', label: 'Blog',
    patterns: ['blog', 'blogs', 'article', 'articles', 'post', 'posts'],
    answer: 'Read career guides and tech deep-dives on our **Blog** at /blogs.',
  },
  {
    id: 'contact', label: 'Contact',
    patterns: ['contact', 'support', 'reach out', 'get in touch', 'email us', 'talk to someone'],
    answer: 'Reach us via the **Contact** page at /contact. We reply within 24 hours.',
  },
  {
    id: 'templates', label: 'Resume templates',
    patterns: ['template', 'templates', 'resume template'],
    answer: 'Download ATS-ready **Resume Templates** at /templates — built to impress recruiters.',
  },
  {
    id: 'tips', label: 'Daily tips',
    patterns: ['tip', 'tips', 'daily tip'],
    answer: 'Get bite-sized daily advice on our **Daily Tips** page at /daily-tips.',
  },
  {
    id: 'success', label: 'Success stories',
    patterns: ['success', 'success story', 'placed', 'got job', 'placement'],
    answer: 'Get inspired by real placement stories at /success-stories!',
  },
  {
    id: 'account', label: 'Account & sign-in',
    patterns: ['account', 'login', 'log in', 'signup', 'sign up', 'register', 'profile'],
    answer: "Sign up or log in from the top-right corner. Once you're in, complete your profile to unlock personalized job matches and roadmaps.",
  },
  {
    id: 'pricing', label: 'Pricing',
    patterns: ['price', 'pricing', 'cost', 'paid', 'subscription', 'expensive'],
    answer: 'Good news — TechChampsByRev is free to use, no paid plan required. 🎉',
  },
  {
    id: 'greeting', label: 'Say hi',
    patterns: ['hi', 'hello', 'hey', 'hii', 'howdy'],
    answer: "Hi there! 👋 I'm **Rev**, your career assistant. Ask me about jobs, courses, roadmaps, resume tips, interviews, or mentorship.",
  },
  {
    id: 'farewell', label: 'Bye',
    patterns: ['bye', 'goodbye', 'thanks', 'thank you'],
    answer: "You're welcome! Best of luck on your tech career journey. Come back anytime! 🚀",
  },
];

const QUICK_ACTIONS = [
  { icon: Briefcase, label: 'Jobs',      query: 'Find jobs' },
  { icon: BookOpen,  label: 'Courses',   query: 'Explore courses' },
  { icon: Map,       label: 'Roadmaps',  query: 'Career roadmaps' },
  { icon: Mic2,      label: 'Interview', query: 'Mock interview' },
  { icon: Users,     label: 'Community', query: 'Join community' },
  { icon: TrendingUp,label: 'Salary',    query: 'Salary insights' },
  { icon: Mail,      label: 'Contact',   query: 'Contact us' },
];

// Shown when a message matches nothing at all — a softer landing than a flat "I don't know".
const POPULAR_SUGGESTIONS: Suggestion[] = QUICK_ACTIONS.slice(0, 4).map(({ label, query }) => ({ label, query }));

// Short replies that mean "go on" rather than a new question — only advance the
// conversation if the last topic actually has more to say (a `followUp`).
const CONTINUATION_PHRASES = [
  'more', 'tell me more', 'more details', 'details', 'how', 'yes', 'yes please',
  'yeah', 'yep', 'sure', 'ok', 'okay', 'continue', 'go on',
];

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ─── Matching engine ───────────────────────────────────────
 * Tokenized + fuzzy instead of the old plain substring search — substring
 * matching had real false positives (e.g. "resource" contains "course",
 * "history" contains "hi") since it checked raw text rather than whole words.
 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  const n = normalize(text);
  return n ? n.split(' ') : [];
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

// Typo tolerance — scaled by word length so short words (where one edit
// changes the meaning) stay exact-match only.
function fuzzyWordMatch(token: string, word: string): boolean {
  if (token === word) return true;
  if (word.length < 4) return false;
  const maxDist = word.length >= 7 ? 2 : 1;
  return levenshtein(token, word) <= maxDist;
}

// 3 = exact phrase found verbatim, 2 = exact word(s) matched, 1 = fuzzy/typo match only.
function scorePattern(pattern: string, tokens: string[], rawQuery: string): number {
  const p = normalize(pattern);
  if (!p) return 0;
  if (p.includes(' ')) {
    if (rawQuery.includes(p)) return 3;
    const words = p.split(' ');
    return words.every(w => tokens.some(t => fuzzyWordMatch(t, w))) ? 2 : 0;
  }
  if (tokens.includes(p)) return 2;
  return tokens.some(t => fuzzyWordMatch(t, p)) ? 1 : 0;
}

function faqScore(faq: Faq, tokens: string[], rawQuery: string): number {
  return Math.max(0, ...faq.patterns.map(p => scorePattern(p, tokens, rawQuery)));
}

const CONFIDENT = 2;

function getBotReply(
  input: string,
  lastTopicId: string | null,
): { text: string; topicId: string | null; suggestions?: Suggestion[] } {
  const rawQuery = normalize(input);
  const tokens = tokenize(input);

  // Short "go on" replies continue the previous topic instead of re-matching from scratch.
  if (lastTopicId && CONTINUATION_PHRASES.includes(rawQuery)) {
    const faq = FAQS.find(f => f.id === lastTopicId);
    if (faq?.followUp) return { text: faq.followUp, topicId: faq.id };
  }

  const scored = FAQS
    .map(faq => ({ faq, score: faqScore(faq, tokens, rawQuery) }))
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      text: "I'm not sure about that one 🤔 — try one of these, or visit **Contact** at /contact and we'll help you out!",
      topicId: null,
      suggestions: POPULAR_SUGGESTIONS,
    };
  }

  if (scored[0].score >= CONFIDENT) {
    // Multi-intent: a message can touch two topics ("jobs and salary insights") —
    // answer both instead of only the first FAQ that happens to match.
    const confident = scored.filter(m => m.score >= CONFIDENT).slice(0, 2);
    const text = confident.map(m => m.faq.answer).join('\n\n');
    return { text, topicId: confident[0].faq.id };
  }

  // Only weak/fuzzy matches — ask rather than guess wrong.
  const candidates = scored.slice(0, 3).map(m => ({ label: m.faq.label, query: m.faq.patterns[0] }));
  return {
    text: 'Not quite sure what you mean — did you mean one of these?',
    topicId: null,
    suggestions: candidates,
  };
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
    text: "Hey! 👋 I'm **Rev**. I can point you to jobs, courses, roadmaps, interview prep, and more — what are you working on today?",
  }]);
  const [input,   setInput]   = useState('');
  const [typing,  setTyping]  = useState(false);
  const [unread,  setUnread]  = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const lastTopicRef = useRef<string | null>(null);

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
      const reply = getBotReply(t, lastTopicRef.current);
      lastTopicRef.current = reply.topicId;
      setMessages(prev => [...prev, {
        id: uid++, from: 'bot', time: now(),
        text: reply.text, suggestions: reply.suggestions,
      }]);
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
      // Shifts up automatically when PushOptInBanner is showing (it sets this
      // CSS var) — otherwise the two fixed-position elements overlap in the
      // bottom-right corner.
      bottom: 'calc(88px + var(--push-banner-offset, 0px))',
      right: 24,
      // Clamp against the viewport itself, not just a single mobile breakpoint —
      // fixes the widget overflowing/covering the screen in smaller or
      // non-maximized browser windows.
      width: 'min(376px, calc(100vw - 32px))',
      maxHeight: 'min(580px, calc(100vh - 120px))',
      display: 'flex',
      flexDirection: 'column' as const,
      background: '#ffffff',
      borderRadius: 20,
      boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      zIndex: 9999,
      border: '1px solid #f0f0f5',
      transition: 'opacity .28s ease, transform .28s cubic-bezier(.34,1.4,.64,1), bottom .25s ease',
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
      background: '#ffffff',
      border: '1px solid #f0f0f5',
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
      whiteSpace: 'pre-line' as const,
    },
    userBubble: {
      maxWidth: '80%',
      background: 'linear-gradient(135deg,var(--brand-indigo),var(--brand-violet))',
      borderRadius: '18px 18px 4px 18px',
      padding: '12px 16px',
      fontSize: 14,
      lineHeight: 1.6,
      color: '#ffffff',
      whiteSpace: 'pre-line' as const,
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
    /* inline "did you mean" / fallback suggestion chips, attached to a bot reply */
    suggestionChip: {
      padding: '6px 12px',
      borderRadius: 100,
      border: '1px solid #ddd6fe',
      background: '#f5f3ff',
      fontSize: 11.5,
      fontWeight: 600,
      color: 'var(--brand-indigo)',
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
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
      background: 'linear-gradient(135deg,var(--brand-indigo),var(--brand-violet))',
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
      bottom: 'calc(24px + var(--push-banner-offset, 0px))', right: 24,
      width: 56, height: 56,
      borderRadius: 18,
      border: 'none',
      background: open ? '#f1f5f9' : '#ffffff',
      boxShadow: open ? '0 2px 12px rgba(0,0,0,0.1)' : '0 4px 20px rgba(15,23,42,0.16)',
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
        <div style={S.window} data-chatbot-window>

          {/* Header */}
          <div style={S.header}>
            <div style={S.avatar}>
              <img src="/rev-avatar.gif" alt="" width={34} height={34} style={{ objectFit: 'contain', mixBlendMode: 'multiply' }} />
              <span style={S.onlineDot} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Rev</p>
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
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
                <div style={msg.from === 'bot' ? S.botBubble : S.userBubble}>
                  <Bubble text={msg.text} />
                </div>
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: '85%' }}>
                    {msg.suggestions.map(s => (
                      <button
                        key={s.label}
                        onClick={() => send(s.query)}
                        style={S.suggestionChip}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#ede9fe'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f5f3ff'; }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
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
                      (e.currentTarget as HTMLElement).style.color = 'var(--brand-indigo)';
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
          : <img src="/rev-avatar.gif" alt="" width={46} height={46} style={{ objectFit: 'contain', mixBlendMode: 'multiply' }} />}
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
