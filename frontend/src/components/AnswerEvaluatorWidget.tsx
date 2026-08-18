'use client';
import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Lock, Check, X } from 'lucide-react';
import { userApi, type AnswerEvaluation } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import AuthModal from './AuthModal';

/**
 * Drop-in widget for the /interview-questions page (and elsewhere).
 * Caller passes the question text + optional question_id. User pastes
 * their answer; AI returns scored feedback.
 */
export default function AnswerEvaluatorWidget({ questionId, questionText }: {
  questionId?: string;
  questionText: string;
}) {
  const { user } = useUser();
  const [answer, setAnswer] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnswerEvaluation | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const MIN = 20, MAX = 5000;

  async function handleEvaluate() {
    if (!user) { setAuthOpen(true); return; }
    setError(''); setBusy(true);
    try {
      const r = await userApi.evaluateAnswer({
        question_id: questionId,
        question_text: questionText,
        answer,
      });
      setResult(r);
    } catch (err: any) {
      setError(err.message || 'Evaluation failed');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="btn btn-outline btn-sm"
          style={{ marginTop: 12 }}
        >
          <Sparkles size={12} /> Evaluate my answer with AI
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" />
      </>
    );
  }

  return (
    <div style={{ marginTop: 12, padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
      {!result ? (
        <>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
            Your answer
          </label>
          <textarea
            className="input"
            value={answer}
            onChange={e => setAnswer(e.target.value.slice(0, MAX))}
            placeholder="Use STAR framework — Situation, Task, Action, Result. Be specific with numbers."
            rows={6}
            style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{answer.length}/{MAX} · min {MIN}</span>
          </div>
          {error && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#dc2626', display: 'flex', gap: 6, alignItems: 'center' }}>
              <AlertCircle size={13} /><span>{error}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={handleEvaluate}
              disabled={busy || answer.length < MIN}
              className="btn btn-blue btn-sm"
              style={{ opacity: (busy || answer.length < MIN) ? 0.6 : 1 }}
            >
              {busy ? <Loader2 size={12} className="spin" /> : !user ? <Lock size={12} /> : <Sparkles size={12} />}
              {busy ? 'Evaluating…' : !user ? 'Sign in to evaluate' : 'Evaluate'}
            </button>
            <button onClick={() => { setOpen(false); setAnswer(''); }} className="btn btn-ghost btn-sm">
              Cancel
            </button>
          </div>
          <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>
            Free: 5 evaluations/day · Pro: unlimited
          </p>
          <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
        </>
      ) : (
        <Result result={result} onReset={() => { setResult(null); setAnswer(''); }} />
      )}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" />
    </div>
  );
}

function Result({ result, onReset }: { result: AnswerEvaluation; onReset: () => void }) {
  return (
    <div>
      {/* Score header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 14px', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 14 }}>
        <div style={{ fontSize: 36, fontWeight: 900, color: scoreColor(result.overall_score), lineHeight: 1, letterSpacing: '-0.03em' }}>
          {result.overall_score}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Overall score</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <SubScore label="Structure" value={result.structure_score} />
            <SubScore label="Clarity" value={result.clarity_score} />
            <SubScore label="Technical" value={result.technical_score} />
          </div>
        </div>
      </div>

      {/* STAR compliance */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {(['situation', 'task', 'action', 'result'] as const).map(k => {
          const present = result.star_compliance?.[k];
          return (
            <div
              key={k}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
                background: present ? '#f0fdf4' : '#fef2f2',
                color: present ? '#15803d' : '#b91c1c',
                border: `1px solid ${present ? '#bbf7d0' : '#fecaca'}`,
                textTransform: 'capitalize',
              }}
            >
              {present ? <Check size={11} /> : <X size={11} />} {k}
            </div>
          );
        })}
      </div>

      {/* Strengths + Improvements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 14 }}>
        <FbList title="Strengths" items={result.strengths} tone="green" />
        <FbList title="Improvements" items={result.improvements} tone="amber" />
      </div>

      {/* Improved version */}
      <div style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.06 }}>
          AI-improved version
        </div>
        <p style={{ fontSize: 13, color: '#0f172a', margin: 0, lineHeight: 1.6 }}>
          {result.improved_version}
        </p>
      </div>

      <button onClick={onReset} className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>
        Try another answer
      </button>
    </div>
  );
}

function SubScore({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: scoreColor(value) }}>{value}</div>
    </div>
  );
}

function FbList({ title, items, tone }: { title: string; items: string[]; tone: 'green' | 'amber' }) {
  const bg = tone === 'green' ? '#f0fdf4' : '#fffbeb';
  const border = tone === 'green' ? '#bbf7d0' : '#fde68a';
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{title}</div>
      {items.map((s, i) => <div key={i} style={{ fontSize: 12, color: '#374151', marginTop: 4, lineHeight: 1.5 }}>• {s}</div>)}
    </div>
  );
}

function scoreColor(n: number): string {
  if (n >= 80) return '#16a34a';
  if (n >= 60) return '#2563eb';
  if (n >= 40) return '#b45309';
  return '#dc2626';
}
