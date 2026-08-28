'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { userApi, type QuizQuestion } from '@/lib/api';

export default function CareerQuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await userApi.quizQuestions();
        setQuestions(res.questions);
        setAnswers(Array(res.questions.length).fill(-1));
      } catch (err: any) {
        setError(err.message || 'Could not load quiz');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Centered><Loader2 size={28} className="spin" style={{ color: '#94a3b8' }} /></Centered>;
  if (error || questions.length === 0) {
    return <Centered><p style={{ color: '#dc2626' }}>{error || 'Quiz not available.'}</p></Centered>;
  }

  const isLast = step === questions.length - 1;
  const q = questions[step];
  const selected = answers[step];
  const allAnswered = answers.every(a => a >= 0);

  function pick(optionId: number) {
    const next = [...answers];
    next[step] = optionId;
    setAnswers(next);
    // Auto-advance after a tiny delay so the selection visually registers
    if (!isLast) setTimeout(() => setStep(step + 1), 250);
  }

  async function handleSubmit() {
    if (!allAnswered) return;
    setSubmitting(true); setError('');
    try {
      const res = await userApi.submitQuiz(answers);
      router.push(`/quiz/${res.share_token}`);
    } catch (err: any) {
      setError(err.message || 'Could not submit');
      setSubmitting(false);
    }
  }

  const progressPct = Math.round(((step + (selected >= 0 ? 1 : 0)) / questions.length) * 100);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '96px 24px 60px' }}>
      <Header />

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
          Question {step + 1} of {questions.length}
        </span>
        <span style={{ fontSize: 12, color: '#64748b' }}>{progressPct}%</span>
      </div>
      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg,#2563eb,var(--brand-violet))', transition: 'width .4s ease' }} />
      </div>

      {/* Question */}
      <div className="card" style={{ padding: 28, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 22px', letterSpacing: '-0.01em' }}>
          {q.question}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map(opt => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => pick(opt.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  background: isSelected ? '#eff6ff' : '#fff',
                  border: `2px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                  color: '#0f172a', fontSize: 14, fontWeight: 500,
                  textAlign: 'left', transition: 'all .15s',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${isSelected ? '#2563eb' : '#cbd5e1'}`,
                  background: isSelected ? '#2563eb' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                </div>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="btn btn-outline btn-sm"
          style={{ opacity: step === 0 ? 0.5 : 1 }}
        >
          <ArrowLeft size={13} /> Previous
        </button>

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="btn btn-blue"
            style={{ opacity: (!allAnswered || submitting) ? 0.5 : 1 }}
          >
            {submitting ? <Loader2 size={14} className="spin" /> : <Brain size={14} />}
            {submitting ? 'Computing your archetype…' : 'See my result'}
          </button>
        ) : (
          <button
            onClick={() => selected >= 0 && setStep(step + 1)}
            disabled={selected < 0}
            className="btn btn-blue btn-sm"
            style={{ opacity: selected < 0 ? 0.5 : 1 }}
          >
            Next <ArrowRight size={13} />
          </button>
        )}
      </div>

      {error && (
        <p style={{ marginTop: 14, fontSize: 13, color: '#dc2626', textAlign: 'center' }}>{error}</p>
      )}
      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}

function Header() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <span className="badge badge-violet" style={{ marginBottom: 12 }}>
        <Brain size={11} style={{ marginRight: 3 }} /> CAREER ARCHETYPE QUIZ
      </span>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
        Which dev are you?
      </h1>
      <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
        10 questions. 2 minutes. Find out which path actually fits.
      </p>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
      {children}
      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}
