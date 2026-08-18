-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 4 — AI FEATURES
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ai_usage ───────────────────────────────────────────────────────────────
-- Append-only ledger of every AI call. Indexed for the (user, feature, time)
-- range query that gates free-tier limits.
CREATE TABLE "ai_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_user_id" UUID,
    "feature" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "cost_usd" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_usage_site_user_id_feature_created_at_idx" ON "ai_usage"("site_user_id", "feature", "created_at");
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage"("created_at");

ALTER TABLE "ai_usage"
    ADD CONSTRAINT "ai_usage_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── resume_optimizations ───────────────────────────────────────────────────
CREATE TABLE "resume_optimizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "share_token" TEXT NOT NULL,
    "site_user_id" UUID NOT NULL,
    "original_text" TEXT NOT NULL,
    "jd_text" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "ai_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_optimizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "resume_optimizations_share_token_key" ON "resume_optimizations"("share_token");
CREATE INDEX "resume_optimizations_share_token_idx" ON "resume_optimizations"("share_token");
CREATE INDEX "resume_optimizations_site_user_id_created_at_idx" ON "resume_optimizations"("site_user_id", "created_at");

ALTER TABLE "resume_optimizations"
    ADD CONSTRAINT "resume_optimizations_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── answer_evaluations ─────────────────────────────────────────────────────
CREATE TABLE "answer_evaluations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_user_id" UUID NOT NULL,
    "question_id" UUID,
    "question_text" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "ai_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_evaluations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "answer_evaluations_site_user_id_created_at_idx" ON "answer_evaluations"("site_user_id", "created_at");

ALTER TABLE "answer_evaluations"
    ADD CONSTRAINT "answer_evaluations_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── mock_interviews ────────────────────────────────────────────────────────
CREATE TABLE "mock_interviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "share_token" TEXT NOT NULL,
    "site_user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "transcript" JSONB NOT NULL DEFAULT '[]',
    "scores" JSONB,
    "ai_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "mock_interviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mock_interviews_share_token_key" ON "mock_interviews"("share_token");
CREATE INDEX "mock_interviews_site_user_id_started_at_idx" ON "mock_interviews"("site_user_id", "started_at");
CREATE INDEX "mock_interviews_share_token_idx" ON "mock_interviews"("share_token");
CREATE INDEX "mock_interviews_status_idx" ON "mock_interviews"("status");

ALTER TABLE "mock_interviews"
    ADD CONSTRAINT "mock_interviews_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
