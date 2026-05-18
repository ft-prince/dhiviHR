-- Add form_templates table
CREATE TABLE "form_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "is_default" boolean NOT NULL DEFAULT false,
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- Add template_questions join table
CREATE TABLE "template_questions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "template_id" uuid NOT NULL REFERENCES "form_templates"("id") ON DELETE CASCADE,
  "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
  "order_index" integer NOT NULL DEFAULT 0,
  "active" boolean NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX "template_questions_uniq" ON "template_questions" ("template_id", "question_id");

-- Add templateId and updatedAt to colleges
ALTER TABLE "colleges"
  ADD COLUMN "template_id" uuid REFERENCES "form_templates"("id"),
  ADD COLUMN "updated_at" timestamptz DEFAULT now() NOT NULL;
