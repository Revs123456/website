-- Dynamic service configuration + generic file uploads (see SERVICES_ARCHITECTURE.md)

ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "requires_slot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "requires_file_upload" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "file_upload_label" TEXT;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "custom_fields" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "custom_field_values" JSONB;

CREATE TABLE "uploaded_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "attached_order_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "uploaded_files_attached_order_id_idx" ON "uploaded_files"("attached_order_id");

CREATE TABLE "order_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "label" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_files_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "order_files_order_id_idx" ON "order_files"("order_id");

ALTER TABLE "order_files"
    ADD CONSTRAINT "order_files_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
