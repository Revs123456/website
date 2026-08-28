-- In-app analytics event log for registered users (sessions, page views,
-- content engagement, Rev widget usage). Anonymous traffic is intentionally
-- not tracked here — GA4 already covers that.
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_user_id" UUID NOT NULL,
    "session_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analytics_events_site_user_id_created_at_idx" ON "analytics_events"("site_user_id", "created_at");
CREATE INDEX "analytics_events_session_id_created_at_idx" ON "analytics_events"("session_id", "created_at");
CREATE INDEX "analytics_events_resource_type_resource_id_idx" ON "analytics_events"("resource_type", "resource_id");
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at");

ALTER TABLE "analytics_events"
    ADD CONSTRAINT "analytics_events_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
