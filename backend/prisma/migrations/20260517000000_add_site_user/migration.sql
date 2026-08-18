-- Add purpose column to existing otp_codes table (backwards compatible default)
ALTER TABLE "otp_codes" ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'verification';

-- CreateTable: site_users (end-user accounts, separate from admins)
CREATE TABLE "site_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "username" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "experience" TEXT,
    "target_role" TEXT,
    "current_role" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "github_url" TEXT,
    "linkedin_url" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "is_pro" BOOLEAN NOT NULL DEFAULT false,
    "pro_expires_at" TIMESTAMPTZ,
    "email_opt_in" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "site_users_email_key" ON "site_users"("email");
CREATE UNIQUE INDEX "site_users_username_key" ON "site_users"("username");
CREATE INDEX "site_users_email_idx" ON "site_users"("email");
CREATE INDEX "site_users_username_idx" ON "site_users"("username");

-- CreateTable: user_refresh_token (mirrors admin refresh_token pattern, FK-enforced)
CREATE TABLE "user_refresh_token" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_hash" TEXT NOT NULL,
    "site_user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_refresh_token_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_refresh_token_token_hash_key" ON "user_refresh_token"("token_hash");
CREATE INDEX "user_refresh_token_token_hash_idx" ON "user_refresh_token"("token_hash");
CREATE INDEX "user_refresh_token_site_user_id_idx" ON "user_refresh_token"("site_user_id");

ALTER TABLE "user_refresh_token"
    ADD CONSTRAINT "user_refresh_token_site_user_id_fkey"
    FOREIGN KEY ("site_user_id") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
