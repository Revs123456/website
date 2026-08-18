import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Deterministic, AI-free match score (0-100).
 * Computed in-memory at request time — no DB writes, no API calls, no cost.
 *
 * Three signals, weighted:
 *   - Role keyword overlap        (40%)   target_role / current_role vs job title
 *   - Skill keyword overlap       (35%)   profile skills vs tech_stack + description
 *   - Experience fit              (25%)   user.experience bucket vs job.experience text
 *
 * Phase 7 will add an LLM enhancement layer for the top 5 results to
 * provide nuanced explanations, but the base ranking stays deterministic.
 */
@Injectable()
export class JobMatchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns a Map of job_id → match score (0-100), computed against the
   * given user's profile.
   *
   * Caller pattern: fetch jobs first, then call this with the resulting IDs.
   * Returns empty map if user has no profile fields filled (can't match).
   */
  async scoreJobsForUser(userId: string, jobs: Array<{
    id: string;
    title: string;
    category: string;
    experience: string;
    tech_stack: string | null;
    description: string;
  }>): Promise<Map<string, number>> {
    const user = await this.prisma.siteUser.findUnique({
      where: { id: userId },
      select: { target_role: true, current_role: true, experience: true, bio: true },
    });

    const scores = new Map<string, number>();
    if (!user || (!user.target_role && !user.current_role)) {
      // No profile data → no useful match. Return empty (UI hides badges).
      return scores;
    }

    const userRoleText = `${user.target_role || ''} ${user.current_role || ''}`.toLowerCase();
    const userRoleTokens = tokenize(userRoleText);

    // Bio doubles as user-provided skill text — many users put "React, Node, TS" in there
    const userSkillText = (user.bio || '').toLowerCase();
    const userSkillTokens = new Set([
      ...tokenize(userSkillText),
      ...userRoleTokens, // Role keywords often imply skills (e.g., "frontend" → react/css/js)
    ]);

    for (const job of jobs) {
      const titleTokens = tokenize(job.title.toLowerCase());
      const techStackTokens = tokenize((job.tech_stack || '').toLowerCase());
      const descTokens = tokenize(job.description.toLowerCase().slice(0, 1000)); // cap for perf

      // ── 1. Role overlap (40%) ─────────────────────────────────────────────
      const roleScore = overlapRatio(userRoleTokens, titleTokens) * 100;

      // ── 2. Skill overlap (35%) ────────────────────────────────────────────
      const jobSkillTokens = new Set([...techStackTokens, ...descTokens]);
      const skillScore = overlapRatio(userSkillTokens, jobSkillTokens) * 100;

      // ── 3. Experience fit (25%) ───────────────────────────────────────────
      const expScore = experienceFit(user.experience, job.experience);

      const total = Math.round(
        roleScore * 0.40 + skillScore * 0.35 + expScore * 0.25,
      );

      // Floor at 30 so users don't see scary "8% match" labels on every job
      // when their profile is sparse. Promotes engagement; UI hides badges
      // below ~40% anyway.
      scores.set(job.id, Math.max(30, Math.min(100, total)));
    }

    return scores;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'a','an','the','and','or','of','to','for','in','at','on','with','by','from',
  'is','are','was','be','been','being','as','it','this','that','these','those',
  'years','year','yr','yrs','full','time','part','remote','onsite','hybrid',
  'engineer','developer','dev', // too common in role text — would inflate matches
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#./\s-]/g, ' ')   // keep . / # + - for c++, .net, c#, react/node
      .split(/\s+/)
      .filter(w => w.length >= 2 && w.length <= 30 && !STOPWORDS.has(w)),
  );
}

/** Jaccard-style overlap, normalized 0-1. */
function overlapRatio(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection++;
  // Use min(|a|,|b|) as denominator instead of union — biases toward
  // "if either side is sparse, what fraction did we hit?". Better UX than
  // Jaccard which would punish detailed JDs.
  const denom = Math.min(a.size, b.size);
  return intersection / denom;
}

/**
 * Experience fit — returns 0-100.
 * Maps user's bucket and job's free-form text into year-ranges and computes overlap.
 */
function experienceFit(userExp: string | null, jobExp: string): number {
  if (!userExp) return 60; // neutral default — don't penalize blank profile

  const userRange = parseExperienceRange(userExp);
  const jobRange = parseExperienceRange(jobExp);
  if (!userRange || !jobRange) return 60;

  const overlap = Math.min(userRange[1], jobRange[1]) - Math.max(userRange[0], jobRange[0]);
  if (overlap < 0) return 30;   // gap exists — partial penalty
  const userSpan = userRange[1] - userRange[0] || 1;
  return Math.min(100, Math.max(40, (overlap / userSpan) * 100));
}

function parseExperienceRange(text: string): [number, number] | null {
  // Examples we handle: "0-1 years", "1-3 years", "5+ years", "Fresher", "2-4 yrs"
  const lower = text.toLowerCase();
  if (lower.includes('fresher') || lower.includes('intern')) return [0, 1];
  const plus = lower.match(/(\d+)\s*\+/);
  if (plus) { const n = parseInt(plus[1], 10); return [n, n + 5]; }
  const range = lower.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return [parseInt(range[1], 10), parseInt(range[2], 10)];
  const single = lower.match(/(\d+)\s*(?:yr|year)/);
  if (single) { const n = parseInt(single[1], 10); return [n, n]; }
  return null;
}
