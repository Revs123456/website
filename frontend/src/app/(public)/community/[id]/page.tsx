'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowUp, Bookmark, BookmarkCheck, Check, Loader2,
  MessageSquare, Sparkles, Trash2, User, AlertCircle, ChevronRight,
} from 'lucide-react';
import { userApi, type CommunityQuestionDetail, type CommunityAnswerRow } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import AuthModal from '@/components/AuthModal';

export default function CommunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || '';
  const { user } = useUser();

  const [question, setQuestion] = useState<CommunityQuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [posting, setPosting] = useState(false);

  const load = async () => {
    try {
      setQuestion(await userApi.getCommunityDetail(id));
    } catch (err: any) {
      setError(err.message || 'Question not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [id]);

  function requireAuth(action: () => void) {
    if (!user) { setAuthOpen(true); return; }
    action();
  }

  // Optimistic toggle helpers — patch local state immediately, rollback on error
  async function toggleQVote() {
    if (!question || !user) { setAuthOpen(true); return; }
    const wasVoted = question.viewer.voted;
    setQuestion(q => q && {
      ...q,
      viewer: { ...q.viewer, voted: !wasVoted },
      votes_count: q.votes_count + (wasVoted ? -1 : 1),
    });
    try {
      const res = await userApi.voteCommunityQuestion(id);
      setQuestion(q => q && { ...q, viewer: { ...q.viewer, voted: res.voted }, votes_count: res.votes_count });
    } catch {
      setQuestion(q => q && {
        ...q,
        viewer: { ...q.viewer, voted: wasVoted },
        votes_count: q.votes_count + (wasVoted ? 1 : -1),
      });
    }
  }

  async function toggleBookmark() {
    if (!question || !user) { setAuthOpen(true); return; }
    const wasBm = question.viewer.bookmarked;
    setQuestion(q => q && { ...q, viewer: { ...q.viewer, bookmarked: !wasBm } });
    try { await userApi.bookmarkCommunityQuestion(id); }
    catch { setQuestion(q => q && { ...q, viewer: { ...q.viewer, bookmarked: wasBm } }); }
  }

  async function toggleAnswerVote(ans: CommunityAnswerRow) {
    if (!user) { setAuthOpen(true); return; }
    const wasVoted = ans.viewer_voted;
    setQuestion(q => q && {
      ...q,
      answers: q.answers.map(a => a.id === ans.id
        ? { ...a, viewer_voted: !wasVoted, votes_count: a.votes_count + (wasVoted ? -1 : 1) }
        : a),
    });
    try {
      const res = await userApi.voteCommunityAnswer(ans.id);
      setQuestion(q => q && {
        ...q,
        answers: q.answers.map(a => a.id === ans.id
          ? { ...a, viewer_voted: res.voted, votes_count: res.votes_count }
          : a),
      });
    } catch {
      setQuestion(q => q && {
        ...q,
        answers: q.answers.map(a => a.id === ans.id
          ? { ...a, viewer_voted: wasVoted, votes_count: a.votes_count + (wasVoted ? 1 : -1) }
          : a),
      });
    }
  }

  async function acceptAnswer(ans: CommunityAnswerRow) {
    if (!question?.viewer.is_author) return;
    try {
      await userApi.acceptCommunityAnswer(ans.id);
      await load();
    } catch { /* silent */ }
  }

  async function deleteOwnAnswer(ans: CommunityAnswerRow) {
    if (!confirm('Delete this answer?')) return;
    try { await userApi.deleteCommunityAnswer(ans.id); await load(); }
    catch { /* silent */ }
  }

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { setAuthOpen(true); return; }
    if (answerText.trim().length < 20) return;
    setPosting(true);
    try {
      await userApi.postCommunityAnswer(id, answerText.trim());
      setAnswerText('');
      await load();
    } catch (err: any) {
      setError(err.message || 'Could not post answer');
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 24px' }}>
        <Loader2 size={28} className="spin" style={{ color: '#94a3b8' }} />
        <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
      </div>
    );
  }
  if (error || !question) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
        <AlertCircle size={28} style={{ color: '#dc2626', marginBottom: 10 }} />
        <p style={{ color: '#64748b', margin: '0 0 16px' }}>{error}</p>
        <Link href="/community" className="btn btn-blue">Back to community</Link>
      </div>
    );
  }

  const tags = (question.tags || '').split(',').map(t => t.trim()).filter(Boolean);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '96px 24px 60px' }}>
      <button onClick={() => router.back()} className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
        <ArrowLeft size={13} /> Back
      </button>

      {/* Question card */}
      <div className="card" style={{ padding: 26, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <VoteColumn
            count={question.votes_count}
            voted={question.viewer.voted}
            onClick={toggleQVote}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {question.solved && (
                <span className="badge badge-green"><Check size={11} style={{ marginRight: 3 }} /> SOLVED</span>
              )}
              {tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              {question.title}
            </h1>
            <p style={{ fontSize: 14, color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.65, margin: '0 0 16px' }}>
              {question.question}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                <User size={12} />
                Asked by <strong style={{ color: '#0f172a' }}>{question.user?.name || question.author_name}</strong>
                <span style={{ color: '#cbd5e1' }}>·</span>
                <span>{new Date(question.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <button onClick={toggleBookmark} className="btn btn-outline btn-sm">
                {question.viewer.bookmarked ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                {question.viewer.bookmarked ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin-curated answer (legacy CMS) */}
      {question.answer && (
        <div className="card" style={{ padding: 22, marginBottom: 18, background: '#f5f3ff', borderColor: '#ddd6fe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: 0.06, marginBottom: 10 }}>
            <Sparkles size={12} /> Curated answer
            {question.answered_by && <span style={{ color: '#94a3b8', fontWeight: 500, textTransform: 'none' }}>by {question.answered_by}</span>}
          </div>
          <p style={{ fontSize: 14, color: '#0f172a', whiteSpace: 'pre-wrap', lineHeight: 1.65, margin: 0 }}>
            {question.answer}
          </p>
        </div>
      )}

      {/* User answers */}
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '24px 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <MessageSquare size={15} />
        {question.answers.length} {question.answers.length === 1 ? 'answer' : 'answers'}
      </h2>

      {question.answers.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
          No answers yet. Be the first to help.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {question.answers.map(ans => (
            <AnswerCard
              key={ans.id}
              ans={ans}
              isQuestionAuthor={question.viewer.is_author}
              currentUserId={user?.id}
              onVote={() => toggleAnswerVote(ans)}
              onAccept={() => acceptAnswer(ans)}
              onDelete={() => deleteOwnAnswer(ans)}
            />
          ))}
        </div>
      )}

      {/* Answer composer */}
      <div className="card" style={{ padding: 22, marginTop: 22 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>
          Your answer
        </h3>
        <form onSubmit={submitAnswer}>
          <textarea
            className="input"
            value={answerText}
            onChange={e => setAnswerText(e.target.value.slice(0, 5000))}
            placeholder={user ? "Share what you'd do or what worked for you. Be specific." : "Sign in to answer this question"}
            rows={5}
            disabled={!user || posting}
            style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {answerText.length}/5000 · min 20
            </span>
            <button
              type="submit"
              disabled={posting || (!!user && answerText.trim().length < 20)}
              onClick={(e) => { if (!user) { e.preventDefault(); setAuthOpen(true); } }}
              className="btn btn-blue btn-sm"
            >
              {posting ? <Loader2 size={12} className="spin" /> : <ChevronRight size={12} />}
              {posting ? 'Posting…' : user ? 'Post answer' : 'Sign in to answer'}
            </button>
          </div>
        </form>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" />
      <style>{`@keyframes _spin { to { transform: rotate(360deg); } } .spin { animation: _spin 1s linear infinite; }`}</style>
    </div>
  );
}

// ── Answer card ────────────────────────────────────────────────────────────
function AnswerCard({ ans, isQuestionAuthor, currentUserId, onVote, onAccept, onDelete }: {
  ans: CommunityAnswerRow;
  isQuestionAuthor: boolean;
  currentUserId?: string;
  onVote: () => void;
  onAccept: () => void;
  onDelete: () => void;
}) {
  const isMine = currentUserId && (ans as any).site_user_id === currentUserId;
  return (
    <div
      className="card"
      style={{
        padding: 20,
        background: ans.accepted ? '#f0fdf4' : '#fff',
        borderColor: ans.accepted ? '#bbf7d0' : '#e2e8f0',
        borderWidth: ans.accepted ? 2 : 1,
      }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <VoteColumn count={ans.votes_count} voted={ans.viewer_voted} onClick={onVote} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {ans.accepted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#15803d', marginBottom: 8 }}>
              <Check size={12} /> ACCEPTED ANSWER
            </div>
          )}
          <p style={{ fontSize: 14, color: '#0f172a', whiteSpace: 'pre-wrap', lineHeight: 1.65, margin: '0 0 14px' }}>
            {ans.content}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
              <User size={11} />
              <strong style={{ color: '#0f172a' }}>{ans.user.name || ans.user.username || 'Anonymous'}</strong>
              {ans.user.is_pro && <span className="badge badge-violet" style={{ fontSize: 9, padding: '1px 6px' }}>PRO</span>}
              <span className="badge badge-blue" style={{ fontSize: 9, padding: '1px 6px' }}>Lv {ans.user.level}</span>
              <span style={{ color: '#cbd5e1' }}>·</span>
              <span>{new Date(ans.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {isQuestionAuthor && !ans.accepted && (
                <button onClick={onAccept} className="btn btn-outline btn-sm" style={{ color: '#15803d', borderColor: '#bbf7d0' }}>
                  <Check size={11} /> Accept
                </button>
              )}
              {isMine && (
                <button onClick={onDelete} title="Delete" className="btn btn-ghost btn-sm" style={{ color: '#dc2626' }}>
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Vote button column ─────────────────────────────────────────────────────
function VoteColumn({ count, voted, onClick }: { count: number; voted: boolean; onClick: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0, minWidth: 32 }}>
      <button
        onClick={onClick}
        title={voted ? 'Remove upvote' : 'Upvote'}
        aria-pressed={voted}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
          background: voted ? '#eff6ff' : '#fff',
          border: `1px solid ${voted ? '#bfdbfe' : '#e2e8f0'}`,
          color: voted ? '#2563eb' : '#64748b',
        }}
      >
        <ArrowUp size={16} />
      </button>
      <span style={{ fontSize: 12, fontWeight: 700, color: voted ? '#2563eb' : '#475569' }}>{count}</span>
    </div>
  );
}
