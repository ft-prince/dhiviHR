-- Manual migration for the "Let's Connect" enquiry feature.
-- Apply directly against the database (psql / neon console). Idempotent.
-- (Hand-written to avoid reconciling pre-existing enum drift in drizzle-kit generate.)

ALTER TABLE "colleges" ADD COLUMN IF NOT EXISTS "location" text;

CREATE TABLE IF NOT EXISTS "enquiries" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name"         text NOT NULL,
  "designation"  text,
  "college_id"   uuid,
  "college_name" text NOT NULL,
  "location"     text,
  "email"        text NOT NULL,
  "mobile"       text NOT NULL,
  "interests"    jsonb DEFAULT '[]'::jsonb NOT NULL,
  "message"      text,
  "status"       text DEFAULT 'new' NOT NULL,
  "created_at"   timestamptz DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'enquiries_college_id_colleges_id_fk'
  ) THEN
    ALTER TABLE "enquiries"
      ADD CONSTRAINT "enquiries_college_id_colleges_id_fk"
      FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE set null;
  END IF;
END $$;
