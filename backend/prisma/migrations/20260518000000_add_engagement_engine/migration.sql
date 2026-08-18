-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 2 — ENGAGEMENT ENGINE
-- ═══════════════════════════════════════════════════════════════════════════

-- Existing site_users gets an XP index for leaderboard performance
CREATE INDEX "site_users_xp_idx" ON "site_users"("xp");

-- ── xp_events ──────────────────────────────────────────────────────────────
-- Append-only ledger; site_users.xp is a denormalized rollup.
CREATE TABLE "xp_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_user_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "xp_events_idempotency_key_key" ON "xp_events"("idempotency_key");
CREATE INDEX "xp_events_site_user_id_created_at_idx" ON "xp_events"("site_user_id", "created_at");
CREATE INDEX "xp_events_created_at_idx" ON "xp_events"("created_at");

ALTER TABLE "xp_events"
    ADD CONSTRAINT "xp_events_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── user_streaks ───────────────────────────────────────────────────────────
-- One row per user. site_user_id is both PK and FK — strict 1:1.
CREATE TABLE "user_streaks" (
    "site_user_id" UUID NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_activity_date" TEXT,
    "shields_remaining" INTEGER NOT NULL DEFAULT 0,
    "shields_used_total" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("site_user_id")
);

CREATE INDEX "user_streaks_current_streak_idx" ON "user_streaks"("current_streak");

ALTER TABLE "user_streaks"
    ADD CONSTRAINT "user_streaks_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── daily_challenges ───────────────────────────────────────────────────────
CREATE TABLE "daily_challenges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" TEXT NOT NULL,
    "question_id" UUID NOT NULL,
    "xp_reward" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_challenges_date_key" ON "daily_challenges"("date");
CREATE INDEX "daily_challenges_date_idx" ON "daily_challenges"("date");

-- No FK to interview_questions — preserves history if a question is deleted.

-- ── challenge_submissions ──────────────────────────────────────────────────
CREATE TABLE "challenge_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_user_id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "answer" TEXT NOT NULL,
    "ai_score" INTEGER,
    "ai_feedback" TEXT,
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_submissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "challenge_submissions_site_user_id_challenge_id_key" ON "challenge_submissions"("site_user_id", "challenge_id");
CREATE INDEX "challenge_submissions_site_user_id_idx" ON "challenge_submissions"("site_user_id");
CREATE INDEX "challenge_submissions_challenge_id_idx" ON "challenge_submissions"("challenge_id");

ALTER TABLE "challenge_submissions"
    ADD CONSTRAINT "challenge_submissions_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "challenge_submissions"
    ADD CONSTRAINT "challenge_submissions_challenge_id_fkey"
    FOREIGN KEY ("challenge_id") REFERENCES "daily_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── badges ─────────────────────────────────────────────────────────────────
CREATE TABLE "badges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🏆',
    "tier" TEXT NOT NULL DEFAULT 'bronze',
    "criteria" JSONB NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "badges_code_key" ON "badges"("code");
CREATE INDEX "badges_published_idx" ON "badges"("published");

-- ── user_badges ────────────────────────────────────────────────────────────
CREATE TABLE "user_badges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_user_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "earned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_badges_site_user_id_badge_id_key" ON "user_badges"("site_user_id", "badge_id");
CREATE INDEX "user_badges_site_user_id_idx" ON "user_badges"("site_user_id");
CREATE INDEX "user_badges_badge_id_idx" ON "user_badges"("badge_id");

ALTER TABLE "user_badges"
    ADD CONSTRAINT "user_badges_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_badges"
    ADD CONSTRAINT "user_badges_badge_id_fkey"
    FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
