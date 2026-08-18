-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 3 — VIRAL GROWTH
-- ═══════════════════════════════════════════════════════════════════════════

-- ── site_users: privacy + referrals ────────────────────────────────────────
ALTER TABLE "site_users" ADD COLUMN "profile_public" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "site_users" ADD COLUMN "referral_code"  TEXT;
ALTER TABLE "site_users" ADD COLUMN "referred_by_id" UUID;

CREATE UNIQUE INDEX "site_users_referral_code_key" ON "site_users"("referral_code");
CREATE INDEX "site_users_profile_public_username_idx" ON "site_users"("profile_public", "username");
CREATE INDEX "site_users_referral_code_idx" ON "site_users"("referral_code");
CREATE INDEX "site_users_referred_by_id_idx" ON "site_users"("referred_by_id");

-- Self-referential FK for the referral graph. SetNull on delete preserves
-- the referee's account if the referrer ever deletes theirs.
ALTER TABLE "site_users"
    ADD CONSTRAINT "site_users_referred_by_id_fkey"
    FOREIGN KEY ("referred_by_id") REFERENCES "site_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── resume_roasts ──────────────────────────────────────────────────────────
CREATE TABLE "resume_roasts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "share_token" TEXT NOT NULL,
    "site_user_id" UUID,
    "resume_text" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "ip_hash" TEXT,
    "ai_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_roasts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "resume_roasts_share_token_key" ON "resume_roasts"("share_token");
CREATE INDEX "resume_roasts_share_token_idx" ON "resume_roasts"("share_token");
CREATE INDEX "resume_roasts_site_user_id_idx" ON "resume_roasts"("site_user_id");
-- Compound index used by the per-IP daily throttle query
CREATE INDEX "resume_roasts_ip_hash_created_at_idx" ON "resume_roasts"("ip_hash", "created_at");

ALTER TABLE "resume_roasts"
    ADD CONSTRAINT "resume_roasts_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── quiz_results ───────────────────────────────────────────────────────────
CREATE TABLE "quiz_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "share_token" TEXT NOT NULL,
    "site_user_id" UUID,
    "result_type" TEXT NOT NULL,
    "result_label" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quiz_results_share_token_key" ON "quiz_results"("share_token");
CREATE INDEX "quiz_results_share_token_idx" ON "quiz_results"("share_token");
CREATE INDEX "quiz_results_site_user_id_idx" ON "quiz_results"("site_user_id");
CREATE INDEX "quiz_results_result_type_idx" ON "quiz_results"("result_type");

ALTER TABLE "quiz_results"
    ADD CONSTRAINT "quiz_results_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
