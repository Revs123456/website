-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 6 — RETENTION & COMMUNITY
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Extensions to community_questions ──────────────────────────────────────
ALTER TABLE "community_questions" ADD COLUMN "site_user_id"  UUID;
ALTER TABLE "community_questions" ADD COLUMN "votes_count"   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "community_questions" ADD COLUMN "answers_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "community_questions_site_user_id_idx" ON "community_questions"("site_user_id");
CREATE INDEX "community_questions_votes_count_idx"  ON "community_questions"("votes_count");

ALTER TABLE "community_questions"
    ADD CONSTRAINT "community_questions_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── saved_jobs ─────────────────────────────────────────────────────────────
CREATE TABLE "saved_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_user_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "notes" TEXT,
    "saved_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "saved_jobs_site_user_id_job_id_key" ON "saved_jobs"("site_user_id", "job_id");
CREATE INDEX "saved_jobs_site_user_id_saved_at_idx" ON "saved_jobs"("site_user_id", "saved_at");

ALTER TABLE "saved_jobs"
    ADD CONSTRAINT "saved_jobs_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saved_jobs"
    ADD CONSTRAINT "saved_jobs_job_id_fkey"
    FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── job_applications ───────────────────────────────────────────────────────
CREATE TABLE "job_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_user_id" UUID NOT NULL,
    "job_id" UUID,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "job_link" TEXT,
    "status" TEXT NOT NULL DEFAULT 'saved',
    "notes" TEXT,
    "applied_at" TIMESTAMPTZ,
    "next_follow_up" TIMESTAMPTZ,
    "offered_salary" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "job_applications_site_user_id_status_idx" ON "job_applications"("site_user_id", "status");
CREATE INDEX "job_applications_next_follow_up_idx" ON "job_applications"("next_follow_up");

ALTER TABLE "job_applications"
    ADD CONSTRAINT "job_applications_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "job_applications"
    ADD CONSTRAINT "job_applications_job_id_fkey"
    FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── community_answers ──────────────────────────────────────────────────────
CREATE TABLE "community_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "site_user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "votes_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_answers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "community_answers_question_id_votes_count_idx" ON "community_answers"("question_id", "votes_count");
CREATE INDEX "community_answers_site_user_id_idx" ON "community_answers"("site_user_id");

ALTER TABLE "community_answers"
    ADD CONSTRAINT "community_answers_question_id_fkey"
    FOREIGN KEY ("question_id") REFERENCES "community_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_answers"
    ADD CONSTRAINT "community_answers_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── community_votes (polymorphic) ──────────────────────────────────────────
CREATE TABLE "community_votes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_user_id" UUID NOT NULL,
    "question_id" UUID,
    "answer_id" UUID,
    "value" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_votes_pkey" PRIMARY KEY ("id")
);

-- Two unique constraints — one per target type. Null-on-one-side combined with
-- non-null-on-other gives "one vote per user per target" semantics.
CREATE UNIQUE INDEX "community_votes_site_user_id_question_id_key" ON "community_votes"("site_user_id", "question_id");
CREATE UNIQUE INDEX "community_votes_site_user_id_answer_id_key"   ON "community_votes"("site_user_id", "answer_id");
CREATE INDEX "community_votes_question_id_idx" ON "community_votes"("question_id");
CREATE INDEX "community_votes_answer_id_idx"   ON "community_votes"("answer_id");

ALTER TABLE "community_votes"
    ADD CONSTRAINT "community_votes_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_votes"
    ADD CONSTRAINT "community_votes_question_id_fkey"
    FOREIGN KEY ("question_id") REFERENCES "community_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_votes"
    ADD CONSTRAINT "community_votes_answer_id_fkey"
    FOREIGN KEY ("answer_id") REFERENCES "community_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── community_bookmarks ────────────────────────────────────────────────────
CREATE TABLE "community_bookmarks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_bookmarks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "community_bookmarks_site_user_id_question_id_key" ON "community_bookmarks"("site_user_id", "question_id");
CREATE INDEX "community_bookmarks_site_user_id_idx" ON "community_bookmarks"("site_user_id");

ALTER TABLE "community_bookmarks"
    ADD CONSTRAINT "community_bookmarks_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_bookmarks"
    ADD CONSTRAINT "community_bookmarks_question_id_fkey"
    FOREIGN KEY ("question_id") REFERENCES "community_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── activity_events ────────────────────────────────────────────────────────
CREATE TABLE "activity_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activity_events_is_public_created_at_idx" ON "activity_events"("is_public", "created_at");
CREATE INDEX "activity_events_site_user_id_created_at_idx" ON "activity_events"("site_user_id", "created_at");
CREATE INDEX "activity_events_type_idx" ON "activity_events"("type");

ALTER TABLE "activity_events"
    ADD CONSTRAINT "activity_events_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── notifications ──────────────────────────────────────────────────────────
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link_url" TEXT,
    "icon" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_site_user_id_read_created_at_idx" ON "notifications"("site_user_id", "read", "created_at");
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
