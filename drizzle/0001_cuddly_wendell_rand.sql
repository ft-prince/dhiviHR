CREATE TYPE "public"."sections_enum" AS ENUM('business_acumen', 'resilience_&_adaptability', 'influence_&_communication', 'growth_mindset', 'execution_&_ownership', 'stream_specific_competency', 'ai_awareness');--> statement-breakpoint
CREATE TABLE "competencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"weight" integer DEFAULT 20 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competencies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "form_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" "sections_enum" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "streams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "template_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "competency" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "stream_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "colleges" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "colleges" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "stream_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "section_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stream_id" uuid;--> statement-breakpoint
ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_questions" ADD CONSTRAINT "template_questions_template_id_form_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."form_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_questions" ADD CONSTRAINT "template_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "template_questions_uniq" ON "template_questions" USING btree ("template_id","question_id");--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE set null ON UPDATE no action;