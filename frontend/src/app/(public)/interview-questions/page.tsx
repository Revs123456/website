'use client';
import { useEffect, useState } from 'react';
import BackButton from '@/components/BackButton';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

const CATEGORIES = ['All', 'DSA', 'System Design', 'HR', 'Frontend', 'Backend'];

const DIFF_BADGE: Record<string, { cls: string; color: string }> = {
  Easy:   { cls: 'badge-green',  color: '#059669' },
  Medium: { cls: 'badge-amber',  color: '#d97706' },
  Hard:   { cls: 'badge-red',    color: '#dc2626' },
};

const CAT_COLOR: Record<string, { c: string; bg: string }> = {
  DSA:            { c: '#2563eb', bg: '#eff6ff' },
  'System Design':{ c: '#7c3aed', bg: '#f5f3ff' },
  HR:             { c: '#059669', bg: '#ecfdf5' },
  Frontend:       { c: '#0891b2', bg: '#ecfeff' },
  Backend:        { c: '#d97706', bg: '#fffbeb' },
};

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid #e2e8f0', borderTopColor: '#2563eb',
        animation: 'spin .8s linear infinite',
      }} />
    </div>
  );
}

function QuestionCard({ q }: { q: any }) {
  const [open, setOpen] = useState(false);
  const diff = DIFF_BADGE[q.difficulty] || { cls: 'badge-slate', color: '#64748b' };
  const cat  = CAT_COLOR[q.category]   || { c: '#64748b', bg: '#f8fafc' };

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {q.company && (
            <span style={{
              padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
              background: '#f1f5f9', color: '#475569',
            }}>
              {q.company}
            </span>
          )}
          {q.role && (
            <span style={{
              padding: '2px 10px', borderRadius: 999, fontSize: 11,
              background: '#f8fafc', color: '#94a3b8',
            }}>
              {q.role}
            </span>
          )}
          <span className={`badge ${diff.cls}`} style={{ marginLeft: 'auto' }}>
            {q.difficulty}
          </span>
          {q.category && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
              borderRadius: 999, fontSize: 11, fontWeight: 600,
              color: cat.c, background: cat.bg,
            }}>
              {q.category}
            </span>
          )}
        </div>

        <p style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, lineHeight: 1.55, marginBottom: 12 }}>
          {q.question}
        </p>

        {q.answer && (
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, color: '#2563eb',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {open ? 'Hide Answer' : 'Show Answer'}
          </button>
        )}
      </div>

      {open && q.answer && (
        <div style={{
          padding: '16px 20px', background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 8 }}>
            Answer
          </p>
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {q.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function InterviewQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [cat, setCat]             = useState('All');

  useEffect(() => {
    fetch(`${BASE}/interview-questions/published`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(setQuestions)
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, []);

  const list = cat === 'All' ? questions : questions.filter(q => q.category === cat);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingTop: 80, paddingBottom: 40 }}>
        <div style={wrap}>
          <BackButton />
          <span className="badge badge-blue" style={{ marginBottom: 12, display: 'inline-flex' }}>
            {questions.length} Questions
          </span>
          <h1 className="text-display-sm">
            Interview <span className="grad-blue">Question Bank</span>
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>
            Real questions from top tech companies
          </p>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 32, paddingBottom: 80 }}>
        {/* Category filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', border: '1px solid',
                background: cat === c ? '#2563eb' : '#fff',
                color:      cat === c ? '#fff'    : '#475569',
                borderColor: cat === c ? '#2563eb' : '#e2e8f0',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            <strong style={{ color: '#0f172a' }}>{list.length}</strong> questions
            {cat !== 'All' && ` in ${cat}`}
          </p>
          {cat !== 'All' && (
            <button
              style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setCat('All')}
            >
              Clear filter
            </button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <HelpCircle size={36} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
            <p>No questions found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {list.map((q, i) => <QuestionCard key={q.id ?? i} q={q} />)}
          </div>
        )}
      </div>
    </div>
  );
}
