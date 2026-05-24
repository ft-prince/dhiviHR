-- Safe idempotent migration: colleges columns + FKs + indexes
-- Tables (competencies, form_templates, template_questions) were already applied manually.

ALTER TABLE "colleges" ADD COLUMN IF NOT EXISTS "template_id" uuid;
--> statement-breakpoint
ALTER TABLE "colleges" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "template_questions" ADD CONSTRAINT "template_questions_template_id_form_templates_id_fk"
    FOREIGN KEY ("template_id") REFERENCES "form_templates"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "template_questions" ADD CONSTRAINT "template_questions_question_id_questions_id_fk"
    FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "template_questions_uniq" ON "template_questions" USING btree ("template_id","question_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assessments_user_id_idx" ON "assessments" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assessments_status_idx" ON "assessments" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assessments_started_at_idx" ON "assessments" USING btree ("started_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "responses_assessment_id_idx" ON "responses" USING btree ("assessment_id");
