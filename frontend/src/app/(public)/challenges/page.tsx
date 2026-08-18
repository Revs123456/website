'use client';
import { useEffect, useState } from 'react';
import {
  Flame, Trophy, Loader2, CheckCircle2, Lock, Building2, Briefcase, Sparkles,
  ArrowRight, Share2, X,
} from 'lucide-react';
import { userApi, type DailyChallenge, type ChallengeSubmissionResult } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import AuthModal from '@/components/AuthModal';
import ShareableStreakCard from '@/components/ShareableStreakCard';

/**
 * /challenges — landing page for the daily challenge ritual.
 *
 * Renders three states:
 *   1. Public visitor (no auth) → shows challenge + "Sign in to submit" CTA
 *   2. Logged in, hasn't submitted → submission form
 *   3. Logged in, already submitted → success state with shareable card
 *
 * No SSG/SSR — the challenge content changes daily and the submission state
 * is per-user; client-side fetch keeps things simple.
 */
export default function ChallengesPage() {
  const { user, loading: userLoading, refresh } = useUser();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [mySubmission, setMySubmission] = useState<{ id: string; answer: string; submitted_at: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [result, setResult] = useState<ChallengeSubmissionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [todays, mine] = await Promise.all([
          userApi.todaysChallenge(),
          user ? userApi.myTodaysSubmission() : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setChallenge(todays);
        setMySubmission(mine);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '96px 24px 60px' }}>
      <PageHeader />

      {loading || userLoading ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Loader2 size={28} className="spin" style={{ color: '#94a3b8' }} />
        </div>
      ) : !challenge?.question ? (
        <EmptyState />
      ) : result ? (
        <CelebrationState result={result} onShare={() => {}} userName={user?.name ?? null} streakNow={result.streak.current} />
      ) : mySubmission ? (
        <AlreadySubmitted challenge={challenge} submission={mySubmission} userName={user?.name ?? null} />
      ) : user ? (
        <SubmissionForm
          challenge={challenge}
          onSubmitted={async (res) => {
            setResult(res);
            setMySubmission({ id: res.submission.id, answer: '', submitted_at: res.submission.submitted_at });
            await refresh();
          }}
        />
      ) : (
        <UnauthenticatedState challenge={challenge} onSignInClick={() => setAuthOpen(true)} />
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" />

      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}

// ── Header ──────────────────────────────────────────────────────────────────
function PageHeader() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <span className="badge badge-amber" style={{ marginBottom: 12 }}>
        <Flame size={11} style={{ marginRight: 3 }} /> DAILY RITUAL
      </span>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
        Today&apos;s Challenge
      </h1>
      <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
        One question. Five minutes. Build the habit that lands the job.
      </p>
    </div>
  );
}

// ── Question card (shared across states) ────────────────────────────────────
function QuestionCard({ challenge }: { challenge: DailyChallenge }) {
  if (!challenge.question) return null;
  const q = challenge.question;
  return (
    <div className="card" style={{ padding: 24, marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <span className="badge badge-blue"><Building2 size={11} style={{ marginRight: 3 }} /> {q.company}</span>
        <span className="badge badge-violet"><Briefcase size={11} style={{ marginRight: 3 }} /> {q.role}</span>
        <span className="badge badge-slate">{q.category}</span>
        <span className={`badge ${q.difficulty === 'Hard' ? 'badge-red' : q.difficulty === 'Easy' ? 'badge-green' : 'badge-amber'}`}>
          {q.difficulty}
        </span>
        <span className="badge badge-cyan" style={{ marginLeft: 'auto' }}>
          <Sparkles size={11} style={{ marginRight: 3 }} /> +{challenge.xp_reward} XP
        </span>
      </div>
      <p style={{ fontSize: 17, lineHeight: 1.6, color: '#0f172a', margin: 0, fontWeight: 500 }}>
        {q.question}
      </p>
    </div>
  );
}

// ── States ──────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="card" style={{ padding: 48, textAlign: 'center' }}>
      <p style={{ color: '#64748b', margin: 0 }}>
        No challenge available yet — check back at midnight IST.
      </p>
    </div>
  );
}

function UnauthenticatedState({ challenge, onSignInClick }: { challenge: DailyChallenge; onSignInClick: () => void }) {
  return (
    <>
      <QuestionCard challenge={challenge} />
      <div className="card" style={{ padding: 24, textAlign: 'center', background: '#f8fafc' }}>
        <Lock size={24} style={{ color: '#64748b', marginBottom: 10 }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
          Sign in to submit and earn XP
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
          Track your streak. Climb the leaderboard. Build the habit.
        </p>
        <button onClick={onSignInClick} className="btn btn-blue">
          Sign in <ArrowRight size={14} />
        </button>
      </div>
    </>
  );
}

function SubmissionForm({
  challenge, onSubmitted,
}: {
  challenge: DailyChallenge;
  onSubmitted: (res: ChallengeSubmissionResult) => void;
}) {
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const min = 10;
  const max = 5000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (answer.length < min) { setError(`Answer must be at least ${min} characters.`); return; }
    setBusy(true);
    try {
      const res = await userApi.submitChallenge(challenge.date, answer);
      onSubmitted(res);
    } catch (err: any) {
      setError(err.message || 'Could not submit.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <QuestionCard challenge={challenge} />
      <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          Your answer
        </label>
        <textarea
          className="input"
          value={answer}
          onChange={e => setAnswer(e.target.value.slice(0, max))}
          placeholder="Use the STAR framework — Situation, Task, Action, Result. Be specific."
          rows={9}
          style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            {answer.length} / {max}
          </span>
          {answer.length > 0 && answer.length < min && (
            <span style={{ fontSize: 11, color: '#dc2626' }}>{min - answer.length} more characters</span>
          )}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#dc2626', marginTop: 12 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="submit" disabled={busy || answer.length < min} className="btn btn-blue" style={{ opacity: (busy || answer.length < min) ? 0.6 : 1 }}>
            {busy ? <Loader2 size={14} className="spin" /> : <ArrowRight size={14} />}
            {busy ? 'Submitting…' : 'Submit & earn XP'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '14px 0 0' }}>
          One shot per day. Your answer is saved to your profile and AI-evaluated in Phase 4.
        </p>
      </form>
    </>
  );
}

function AlreadySubmitted({ challenge, submission, userName }: {
  challenge: DailyChallenge;
  submission: { id: string; answer: string; submitted_at: string };
  userName: string | null;
}) {
  const { user } = useUser();
  return (
    <>
      <QuestionCard challenge={challenge} />
      <div className="card" style={{ padding: 24, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#14532d', margin: 0 }}>
            You&apos;ve completed today&apos;s challenge
          </h3>
        </div>
        <p style={{ fontSize: 13, color: '#166534', margin: '0 0 14px' }}>
          Submitted {new Date(submission.submitted_at).toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}. Come back tomorrow to keep your streak alive.
        </p>
        {user && user.streak && user.streak.current_streak > 0 && (
          <ShareableStreakCard
            streak={user.streak.current_streak}
            userName={userName}
            xp={user.xp}
            level={user.level}
          />
        )}
      </div>
    </>
  );
}

function CelebrationState({ result, userName, streakNow }: {
  result: ChallengeSubmissionResult;
  onShare: () => void;
  userName: string | null;
  streakNow: number;
}) {
  return (
    <div className="card" style={{ padding: 32, textAlign: 'center', background: 'linear-gradient(135deg,#eff6ff 0%,#f5f3ff 100%)', borderColor: '#bfdbfe' }}>
      <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 12 }}>🎉</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
        +{result.xp.awarded} XP
        {result.xp.leveled_up && <span style={{ color: '#7c3aed', display: 'block', fontSize: 18, marginTop: 4 }}>🚀 Leveled up to {result.xp.new_level}!</span>}
      </h2>
      <p style={{ fontSize: 14, color: '#475569', margin: '0 0 18px' }}>
        Streak: <strong style={{ color: '#b45309' }}>🔥 {result.streak.current} day{result.streak.current === 1 ? '' : 's'}</strong>
        {result.streak.milestone_hit && (
          <span style={{ display: 'block', marginTop: 6, color: '#16a34a', fontWeight: 700 }}>
            Milestone unlocked! +{result.streak.milestone_xp} bonus XP
          </span>
        )}
      </p>

      {result.new_badges.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.05 }}>
            New badges earned
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {result.new_badges.map(b => (
              <div key={b.id} className="badge badge-violet" style={{ fontSize: 13, padding: '6px 12px' }}>
                <span style={{ fontSize: 16, marginRight: 4 }}>{b.icon}</span> {b.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <ShareableStreakCard streak={streakNow} userName={userName} xp={result.xp.total_xp} level={result.xp.new_level} />
    </div>
  );
}
