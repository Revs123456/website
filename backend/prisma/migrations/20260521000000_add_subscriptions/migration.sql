-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 5 — MONETIZATION (Razorpay Subscriptions)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── plans ──────────────────────────────────────────────────────────────────
CREATE TABLE "plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_inr" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "features" JSONB NOT NULL DEFAULT '[]',
    "razorpay_plan_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");
CREATE UNIQUE INDEX "plans_razorpay_plan_id_key" ON "plans"("razorpay_plan_id");
CREATE INDEX "plans_active_sort_order_idx" ON "plans"("active", "sort_order");

-- ── subscriptions ──────────────────────────────────────────────────────────
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "razorpay_subscription_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "current_period_start" TIMESTAMPTZ,
    "current_period_end" TIMESTAMPTZ,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" TIMESTAMPTZ,
    "activated_at" TIMESTAMPTZ,
    "charges_count" INTEGER NOT NULL DEFAULT 0,
    "total_paid_paise" INTEGER NOT NULL DEFAULT 0,
    "raw_payload" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscriptions_razorpay_subscription_id_key" ON "subscriptions"("razorpay_subscription_id");
CREATE INDEX "subscriptions_site_user_id_status_idx" ON "subscriptions"("site_user_id", "status");
CREATE INDEX "subscriptions_razorpay_subscription_id_idx" ON "subscriptions"("razorpay_subscription_id");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX "subscriptions_current_period_end_idx" ON "subscriptions"("current_period_end");

ALTER TABLE "subscriptions"
    ADD CONSTRAINT "subscriptions_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscriptions"
    ADD CONSTRAINT "subscriptions_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON UPDATE CASCADE;

-- ── payment_events ─────────────────────────────────────────────────────────
CREATE TABLE "payment_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscription_id" UUID,
    "razorpay_event_id" TEXT NOT NULL,
    "razorpay_payment_id" TEXT,
    "event_type" TEXT NOT NULL,
    "amount_paid_paise" INTEGER,
    "raw_payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_events_razorpay_event_id_key" ON "payment_events"("razorpay_event_id");
CREATE INDEX "payment_events_subscription_id_created_at_idx" ON "payment_events"("subscription_id", "created_at");
CREATE INDEX "payment_events_event_type_idx" ON "payment_events"("event_type");

ALTER TABLE "payment_events"
    ADD CONSTRAINT "payment_events_subscription_id_fkey"
    FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
