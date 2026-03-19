'use client';
import { useState } from 'react';
import { MessageCircle, ChevronDown, ChevronUp, X, CheckCircle2 } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

const EMPTY_FORM = { author_name: '', title: '', question: '', tags: '' };

function PostCard({ post }: { post: any }) {
  const [open, setOpen] = useState(false);
  const tags: string[] = post.tags
    ? post.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : [];
  const solved = post.solved === true || post.solved === 1 || post.solved === 'true';
  const preview = post.question?.slice(0, 160) + (post.question?.length > 160 ? '…' : '');

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: 20 }}>
        {/* Status + meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {solved ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              color: '#059669', background: '#ecfdf5',
            }}>
              <CheckCircle2 size={11} /> Solved
            </span>
          ) : (
            <span className="badge badge-slate">Open</span>
          )}
          {post.author_name && (
            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>
              by {post.author_name}
            </span>
          )}
          {tags.map(t => (
            <span key={t} style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 11,
              background: '#eff6ff', color: '#2563eb', fontWeight: 600,
            }}>
              {t}
            </span>
          ))}
        </div>

        <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>
          {post.title}
        </h3>

        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 12 }}>
          {open ? post.question : preview}
        </p>

        {(post.question?.length > 160 || post.answer) && (
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 600, color: '#2563eb',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {open ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {open && post.answer && (
        <div style={{
          padding: '16px 20px',
          background: '#f0fdf4',
          borderTop: '1px solid #bbf7d0',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#059669', marginBottom: 8 }}>
            Answer
          </p>
          <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {post.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function CommunityClient({ posts }: { posts: any[] }) {
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');

  function set(k: keyof typeof EMPTY_FORM, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${BASE}/community`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: form.author_name,
          title:       form.title,
          question:    form.question,
          tags:        form.tags,
          published:   false,
        }),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
      setForm(EMPTY_FORM);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingTop: 80, paddingBottom: 40 }}>
        <div style={wrap}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="badge badge-violet" style={{ marginBottom: 12, display: 'inline-flex' }}>
                {posts.length} Questions
              </span>
              <h1 className="text-display-sm">
                Community <span className="grad-blue">Q&amp;A</span>
              </h1>
              <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>
                Ask, answer, and learn together
              </p>
            </div>
            <button
              className="btn btn-blue"
              onClick={() => { setShowModal(true); setSuccess(false); setError(''); }}
              style={{ alignSelf: 'flex-end' }}
            >
              Ask a Question
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 40, paddingBottom: 80 }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <MessageCircle size={36} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
            <p>No questions yet. Ask the first one!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {posts.map((p, i) => <PostCard key={p.id ?? i} post={p} />)}
          </div>
        )}
      </div>

      {/* Ask Question Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(15,23,42,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{
            background: '#fff', borderRadius: 20, padding: 32,
            width: '100%', maxWidth: 520,
            boxShadow: '0 20px 60px rgba(0,0,0,.18)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>Ask a Question</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {success ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontWeight: 700, color: '#059669', marginBottom: 8 }}>Question Submitted!</h3>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
                  Your question will be visible after review.
                </p>
                <button className="btn btn-blue" onClick={() => setShowModal(false)}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Your Name *
                  </label>
                  <input
                    className="input"
                    required
                    placeholder="e.g. Priya K."
                    value={form.author_name}
                    onChange={e => set('author_name', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Question Title *
                  </label>
                  <input
                    className="input"
                    required
                    placeholder="e.g. How do I prepare for system design in 2 weeks?"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Details *
                  </label>
                  <textarea
                    className="input"
                    required
                    rows={5}
                    placeholder="Provide context, what you've tried, and what you need help with…"
                    value={form.question}
                    onChange={e => set('question', e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    Tags (comma separated)
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. React, System Design, Job Search"
                    value={form.tags}
                    onChange={e => set('tags', e.target.value)}
                  />
                </div>

                {error && (
                  <p style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '10px 14px', borderRadius: 8 }}>
                    {error}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-blue" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Post Question'}
                  </button>
                </div>

                <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
                  Questions are reviewed before publishing.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
