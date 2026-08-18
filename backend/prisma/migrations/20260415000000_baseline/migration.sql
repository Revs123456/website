-- Baseline migration: creates all tables that already exist in production.
-- Uses IF NOT EXISTS so this is safe to run on an already-provisioned database.

CREATE TABLE IF NOT EXISTS "admins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "admins_email_key" ON "admins"("email");

CREATE TABLE IF NOT EXISTS "jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Full-time',
    "category" TEXT NOT NULL DEFAULT 'Frontend',
    "salary" TEXT,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "benefits" TEXT,
    "tech_stack" TEXT,
    "apply_link" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Frontend',
    "duration" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'Beginner',
    "instructor" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "students" TEXT,
    "price" TEXT,
    "description" TEXT,
    "modules" TEXT,
    "course_link" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "blogs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "author" TEXT,
    "read_time" TEXT,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "cover_image" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "included_features" TEXT NOT NULL,
    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

CREATE TABLE IF NOT EXISTS "testimonials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "initials" TEXT,
    "color" TEXT NOT NULL DEFAULT '#2563eb',
    "bg" TEXT NOT NULL DEFAULT '#eff6ff',
    "package" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "subscribers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT,
    "whatsapp" TEXT,
    "type" TEXT NOT NULL DEFAULT 'both',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "interview_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'Medium',
    "category" TEXT NOT NULL DEFAULT 'DSA',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "salary_insights" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "experience_level" TEXT NOT NULL,
    "min_salary" TEXT NOT NULL,
    "max_salary" TEXT NOT NULL,
    "avg_salary" TEXT,
    "companies" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "salary_insights_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "daily_tips" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tip" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Career',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_tips_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "success_stories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "before_role" TEXT NOT NULL,
    "after_role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "salary_hike" TEXT,
    "story" TEXT NOT NULL,
    "initials" TEXT,
    "color" TEXT NOT NULL DEFAULT '#2563eb',
    "bg" TEXT NOT NULL DEFAULT '#eff6ff',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "success_stories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "community_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author_name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answered_by" TEXT,
    "tags" TEXT,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "community_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "experience" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "preferred_date" TEXT,
    "preferred_time" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "resume_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" TEXT NOT NULL DEFAULT 'Free',
    "download_link" TEXT,
    "preview_image" TEXT,
    "tag" TEXT NOT NULL DEFAULT 'ATS-Friendly',
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resume_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "roadmaps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#2563eb',
    "icon" TEXT NOT NULL DEFAULT 'Globe',
    "steps" JSONB,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,
    "customer_name" TEXT,
    "email" TEXT,
    "customer_email" TEXT,
    "service_type" TEXT,
    "service_id" TEXT,
    "experience_level" TEXT,
    "message" TEXT,
    "resume_file" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_status" TEXT NOT NULL DEFAULT 'unpaid',
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "amount" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "slots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_booked" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "booked_name" VARCHAR,
    "booked_email" VARCHAR,
    "order_id" VARCHAR,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admin_email" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);
