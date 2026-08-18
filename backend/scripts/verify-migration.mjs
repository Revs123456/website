/**
 * Post-migration sanity check.
 *
 * Confirms the new Phase 1-7 tables exist + reports row counts.
 * Phase 5 plans table is seeded on backend boot — initial run will show 0,
 * and that's fine. Run after restarting the backend to see seeded data.
 */
import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// All tables added by Phases 1–7, grouped by phase
const EXPECTED = {
  'Phase 1 (Users)':     ['site_users', 'user_refresh_token'],
  'Phase 2 (Engagement)':['xp_events', 'user_streaks', 'daily_challenges', 'challenge_submissions', 'badges', 'user_badges'],
  'Phase 3 (Viral)':     ['resume_roasts', 'quiz_results'],
  'Phase 4 (AI)':        ['ai_usage', 'resume_optimizations', 'answer_evaluations', 'mock_interviews'],
  'Phase 5 (Money)':     ['plans', 'subscriptions', 'payment_events'],
  'Phase 6 (Retention)': ['saved_jobs', 'job_applications', 'community_answers', 'community_votes', 'community_bookmarks', 'activity_events', 'notifications'],
  'Phase 7 (Production)':['push_subscriptions'],
};

await client.connect();

let totalExpected = 0;
let totalFound = 0;
const missing = [];

for (const [phase, tables] of Object.entries(EXPECTED)) {
  console.log(`\n${phase}:`);
  for (const t of tables) {
    totalExpected++;
    try {
      const r = await client.query(`SELECT COUNT(*) AS n FROM "${t}"`);
      const n = parseInt(r.rows[0].n, 10);
      console.log(`  ✅ ${t.padEnd(28)} ${n} rows`);
      totalFound++;
    } catch (err) {
      console.log(`  ❌ ${t.padEnd(28)} MISSING`);
      missing.push(t);
    }
  }
}

// Spot-check: phase 3+5+6 columns added to existing tables
console.log('\nColumn additions on existing tables:');
const colChecks = [
  ['otp_codes',           'purpose'],
  ['site_users',          'profile_public'],
  ['site_users',          'referral_code'],
  ['community_questions', 'votes_count'],
  ['community_questions', 'answers_count'],
];
for (const [table, col] of colChecks) {
  const r = await client.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=$1 AND column_name=$2
  `, [table, col]);
  console.log(`  ${r.rowCount > 0 ? '✅' : '❌'} ${table}.${col}`);
}

await client.end();

console.log(`\n${'='.repeat(48)}`);
console.log(`Tables found: ${totalFound}/${totalExpected}`);
if (missing.length > 0) {
  console.log(`Missing: ${missing.join(', ')}`);
  process.exit(1);
} else {
  console.log('All Phase 1-7 tables present ✅');
}
