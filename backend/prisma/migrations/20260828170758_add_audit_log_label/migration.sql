-- Adds a best-effort human-readable label to audit log entries, so
-- "DELETE /v1/courses/c89a94c2-..." can show as "Deleted course — React
-- Fundamentals" instead of a bare UUID.
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "label" TEXT;
