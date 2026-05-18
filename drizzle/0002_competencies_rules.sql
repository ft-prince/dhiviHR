-- 1. Add competencies table
CREATE TABLE "competencies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "label" text NOT NULL,
  "description" text,
  "weight" integer NOT NULL DEFAULT 20,
  "active" boolean NOT NULL DEFAULT true,
  "order_index" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "competencies_slug_unique" UNIQUE ("slug")
);

-- 2. Seed the five existing competencies
INSERT INTO "competencies" ("slug", "label", "order_index") VALUES
  ('communication_confidence', 'Communication & Confidence',  0),
  ('problem_solving',          'Problem Solving Ability',      1),
  ('teamwork_leadership',      'Teamwork & Leadership',        2),
  ('initiative_growth',        'Initiative & Growth Mindset',  3),
  ('interview_readiness',      'Interview Readiness',          4);

-- 3. Convert questions.competency from enum to text (data is preserved)
ALTER TABLE "questions"
  ALTER COLUMN "competency" TYPE text USING "competency"::text;

-- 4. Add rules column to form_templates
ALTER TABLE "form_templates"
  ADD COLUMN "rules" jsonb NOT NULL DEFAULT '[]';
