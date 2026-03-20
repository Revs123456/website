'use client';
import { useState } from 'react';
import BackButton from '@/components/BackButton';
import { FileText, CheckCircle, AlertCircle, Info, Upload } from 'lucide-react';

const SKILLS_DB = [
  'react', 'next.js', 'nextjs', 'typescript', 'javascript', 'node.js', 'nodejs',
  'python', 'java', 'spring boot', 'springboot', 'golang', 'rust', 'php', 'laravel',
  'vue', 'angular', 'svelte', 'tailwind', 'css', 'html', 'sass', 'scss',
  'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
  'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'ansible',
  'graphql', 'rest', 'grpc', 'microservices', 'ci/cd', 'git', 'github', 'gitlab',
  'jest', 'cypress', 'playwright', 'testing', 'tdd',
  'agile', 'scrum', 'jira', 'confluence', 'figma',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'nlp',
  'linux', 'bash', 'shell scripting',
];

const ATS_KEYWORDS = [
  'experience', 'developed', 'implemented', 'designed', 'led', 'managed',
  'optimized', 'improved', 'reduced', 'increased', 'built', 'created',
  'collaborated', 'delivered', 'achieved', 'responsible', 'technical',
];

function analyzeResume(text: string) {
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Skills found
  const foundSkills = SKILLS_DB.filter(s => lower.includes(s));

  // Action verbs
  const foundVerbs = ATS_KEYWORDS.filter(k => lower.includes(k));

  // Checks
  const hasEmail = /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /(\+91[\s-]?)?[6-9]\d{9}|(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/.test(text);
  const hasLinkedIn = /linkedin\.com/i.test(text);
  const hasGitHub = /github\.com/i.test(text);
  const hasSummary = /summary|objective|profile|about/i.test(text);
  const hasEducation = /education|degree|b\.tech|b\.e\.|mca|bca|bachelor|master|university|college/i.test(text);
  const hasExperience = /experience|work history|employment/i.test(text);
  const hasProjects = /project|built|developed|created/i.test(text);
  const hasMetrics = /\d+%|\d+x|\d+ (users|clients|projects|team|members|million|thousand|lakhs)/i.test(text);
  const goodLength = wordCount >= 300 && wordCount <= 800;

  const checks = [
    { label: 'Contact information (email)', pass: hasEmail },
    { label: 'Phone number', pass: hasPhone },
    { label: 'LinkedIn profile', pass: hasLinkedIn },
    { label: 'GitHub profile', pass: hasGitHub },
    { label: 'Professional summary', pass: hasSummary },
    { label: 'Education section', pass: hasEducation },
    { label: 'Work experience section', pass: hasExperience },
    { label: 'Projects section', pass: hasProjects },
    { label: 'Quantified achievements (numbers/metrics)', pass: hasMetrics },
    { label: `Appropriate length (${wordCount} words, ideal: 300–800)`, pass: goodLength },
    { label: `Action verbs used (${foundVerbs.length} found)`, pass: foundVerbs.length >= 3 },
    { label: `Technical skills detected (${foundSkills.length} found)`, pass: foundSkills.length >= 3 },
  ];

  const passCount = checks.filter(c => c.pass).length;
  const score = Math.round((passCount / checks.length) * 100);

  return { score, checks, foundSkills, wordCount };
}

export default function ATSCheckerPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ReturnType<typeof analyzeResume> | null>(null);

  function handleCheck() {
    if (!text.trim()) return;
    setResult(analyzeResume(text));
  }

  const scoreColor = result
    ? result.score >= 80 ? '#059669' : result.score >= 60 ? '#d97706' : '#dc2626'
    : '#2563eb';

  return (
    <section style={{ background: '#f8fafc', minHeight: '100vh', padding: '80px 0' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="badge badge-green" style={{ marginBottom: 12, display: 'inline-flex' }}>Free Tool</span>
          <h1 className="text-display-sm">ATS Resume Score Checker</h1>
          <p style={{ fontSize: 15, color: '#64748b', marginTop: 12, maxWidth: 540, margin: '12px auto 0' }}>
            Paste your resume text below to get an instant ATS compatibility score and actionable feedback.
          </p>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
            <FileText size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            Paste your resume text
          </label>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setResult(null); }}
            rows={14}
            placeholder="Paste your full resume content here (plain text)..."
            style={{
              width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 10,
              fontSize: 13, lineHeight: 1.6, resize: 'vertical', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box', color: '#374151',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              {text.split(/\s+/).filter(Boolean).length} words — your resume is analyzed locally, nothing is stored.
            </p>
            <button
              onClick={handleCheck}
              disabled={!text.trim()}
              className="btn btn-blue"
              style={{ gap: 6, display: 'inline-flex', alignItems: 'center' }}
            >
              <Upload size={14} /> Check ATS Score
            </button>
          </div>
        </div>

        {result && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
            {/* Score */}
            <div className="card" style={{ padding: 28, textAlign: 'center' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>ATS Score</p>
              <div style={{
                width: 120, height: 120, borderRadius: '50%', margin: '0 auto 16px',
                background: `conic-gradient(${scoreColor} ${result.score * 3.6}deg, #e2e8f0 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: scoreColor }}>{result.score}</span>
                </div>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: scoreColor }}>
                {result.score >= 80 ? 'Excellent' : result.score >= 60 ? 'Good — Needs work' : 'Needs Improvement'}
              </p>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                {result.checks.filter(c => c.pass).length}/{result.checks.length} checks passed
              </p>

              {result.foundSkills.length > 0 && (
                <div style={{ marginTop: 20, textAlign: 'left' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Skills Detected</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {result.foundSkills.slice(0, 12).map(s => (
                      <span key={s} className="badge badge-green" style={{ fontSize: 10 }}>{s}</span>
                    ))}
                    {result.foundSkills.length > 12 && (
                      <span className="badge badge-slate" style={{ fontSize: 10 }}>+{result.foundSkills.length - 12} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="card" style={{ padding: 28 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Detailed Checklist</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.checks.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {c.pass
                      ? <CheckCircle size={16} style={{ color: '#059669', flexShrink: 0 }} />
                      : <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                    }
                    <span style={{ fontSize: 13, color: c.pass ? '#374151' : '#64748b' }}>{c.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, padding: 14, background: '#eff6ff', borderRadius: 10, display: 'flex', gap: 10 }}>
                <Info size={16} style={{ color: '#2563eb', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: '#1d4ed8', lineHeight: 1.6 }}>
                  Want a professionally reviewed and ATS-optimized resume? Check out our <a href="/services" style={{ fontWeight: 700, color: '#2563eb' }}>Resume Services</a>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
