/**
 * Single source of truth for Phase 2 engagement values.
 * Imported by xp.service, streak.service, challenges.service, badges seed,
 * and frontend (via /v1/engagement/config endpoint if needed later).
 *
 * Treat all of these as data-not-code: changing numbers here shifts user
 * behavior, so the values are reviewed as a unit, not buried per-feature.
 */

// ── XP award reasons (string enum — kept open so new modules can add reasons) ─
// Only 4 actions actually grant XP right now: first_login, profile_complete,
// daily_login, and the referral pair (referral_made/referral_joined, awarded
// directly by ReferralsService — not listed here since they're not read from
// this enum). username_claimed, daily_challenge, streak_milestone, and
// badge_awarded are kept as historical/inert reasons — old XpEvent ledger
// rows still reference them, and the underlying features (usernames,
// challenges, streaks, badges) still work — they just no longer pay out XP.
export const XP_REASONS = {
  FIRST_LOGIN: 'first_login',
  PROFILE_COMPLETE: 'profile_complete',
  DAILY_LOGIN: 'daily_login',
  USERNAME_CLAIMED: 'username_claimed',
  DAILY_CHALLENGE: 'daily_challenge',
  STREAK_MILESTONE: 'streak_milestone',
  BADGE_AWARDED: 'badge_awarded',
} as const;
export type XpReason = (typeof XP_REASONS)[keyof typeof XP_REASONS] | string;

// ── XP amounts (the dial that controls progression speed) ───────────────────
export const XP_AMOUNTS = {
  FIRST_LOGIN: 25,
  PROFILE_COMPLETE: 100,
  DAILY_LOGIN: 10,
} as const;

// ── Streak milestones → XP bonus ────────────────────────────────────────────
// Hit on the day the milestone is reached. Idempotency via XpEvent.idempotency_key.
export const STREAK_MILESTONES: { days: number; xp: number }[] = [
  { days: 3,   xp: 75 },
  { days: 7,   xp: 200 },
  { days: 14,  xp: 400 },
  { days: 30,  xp: 1000 },
  { days: 60,  xp: 2500 },
  { days: 100, xp: 5000 },
  { days: 365, xp: 25000 },
];

// ── Level tiers ─────────────────────────────────────────────────────────────
// Cumulative XP needed to REACH a level. Index = level - 1.
// Chosen so an active user (1 challenge/day @ 50 XP) reaches:
//   Lv 2 after ~2 days, Lv 4 after ~3 weeks, Lv 6 after ~5 months, Lv 8 in ~2 years.
export const LEVEL_THRESHOLDS = [
  0,      // 1 — Rookie
  100,    // 2 — Intern
  500,    // 3 — Junior Dev
  1500,   // 4 — Mid-Level
  3500,   // 5 — Senior Dev
  7000,   // 6 — Staff Engineer
  15000,  // 7 — Principal
  30000,  // 8 — Tech Architect
];

export const LEVEL_NAMES = [
  'Rookie',
  'Intern',
  'Junior Dev',
  'Mid-Level',
  'Senior Dev',
  'Staff Engineer',
  'Principal',
  'Tech Architect',
];

/** Total XP → level number (1-indexed). Clamped to max level. */
export function calcLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

/** Returns the level's display name. */
export function levelName(level: number): string {
  return LEVEL_NAMES[Math.max(0, Math.min(level - 1, LEVEL_NAMES.length - 1))];
}

/**
 * Returns progress to the next level: { current_threshold, next_threshold, xp_into_level, xp_to_next }
 * Used by the XP bar UI. At max level, xp_to_next is 0 and the bar is full.
 */
export function levelProgress(xp: number) {
  const level = calcLevel(xp);
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = LEVEL_THRESHOLDS[level] ?? current;
  const xpIntoLevel = xp - current;
  const xpToNext = Math.max(0, next - xp);
  const isMaxLevel = level >= LEVEL_THRESHOLDS.length;
  return {
    level,
    name: levelName(level),
    current_threshold: current,
    next_threshold: next,
    xp_into_level: xpIntoLevel,
    xp_to_next: xpToNext,
    is_max_level: isMaxLevel,
  };
}

// ── IST date helpers ────────────────────────────────────────────────────────
// India Standard Time is UTC+5:30 with no DST — safe to compute offset directly.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Returns the current IST calendar date as YYYY-MM-DD. */
export function istTodayDate(now: Date = new Date()): string {
  const istMs = now.getTime() + IST_OFFSET_MS;
  const d = new Date(istMs);
  // d.getUTCXxx() now reflects IST wall-clock because we shifted by offset
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns yesterday's IST date as YYYY-MM-DD (for streak continuity checks). */
export function istYesterdayDate(now: Date = new Date()): string {
  return istTodayDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
}

/** Days between two YYYY-MM-DD strings. Positive if `b` is after `a`. */
export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z').getTime();
  const db = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((db - da) / (24 * 60 * 60 * 1000));
}
