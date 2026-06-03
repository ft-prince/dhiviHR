import { pgTable, uniqueIndex, foreignKey, uuid, text, timestamp, integer, unique, jsonb, boolean, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const assessmentStatus = pgEnum("assessment_status", ['in_progress', 'completed', 'abandoned'])
export const competency = pgEnum("competency", ['communication_confidence', 'problem_solving', 'teamwork_leadership', 'initiative_growth', 'interview_readiness'])
export const paymentStatus = pgEnum("payment_status", ['created', 'paid', 'failed', 'refunded'])
export const readinessLevel = pgEnum("readiness_level", ['emerging', 'developing', 'industry_ready', 'high_impact'])
export const sectionsEnum = pgEnum("sections_enum", ['business_acumen', 'resilience_&_adaptability', 'influence_&_communication', 'growth_mindset', 'execution_&_ownership', 'stream_specific_competency', 'ai_awareness'])
export const userRole = pgEnum("user_role", ['student', 'college_student', 'client_admin', 'super_admin'])


export const accessCodes = pgTable("access_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	batchId: uuid("batch_id").notNull(),
	collegeId: uuid("college_id").notNull(),
	code: text().notNull(),
	redeemedBy: uuid("redeemed_by"),
	redeemedAt: timestamp("redeemed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("access_codes_code_unique").using("btree", table.code.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [accessCodeBatches.id],
			name: "access_codes_batch_id_access_code_batches_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.collegeId],
			foreignColumns: [colleges.id],
			name: "access_codes_college_id_colleges_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.redeemedBy],
			foreignColumns: [users.id],
			name: "access_codes_redeemed_by_users_id_fk"
		}),
]);

export const sessions = pgTable("sessions", {
	sessionToken: text("session_token").primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const accessCodeBatches = pgTable("access_code_batches", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	collegeId: uuid("college_id").notNull(),
	label: text().notNull(),
	size: integer().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.collegeId],
			foreignColumns: [colleges.id],
			name: "access_code_batches_college_id_colleges_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "access_code_batches_created_by_users_id_fk"
		}),
]);

export const colleges = pgTable("colleges", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	contactEmail: text("contact_email"),
	contactPhone: text("contact_phone"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	templateId: uuid("template_id"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("colleges_slug_unique").on(table.slug),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text(),
	email: text().notNull(),
	emailVerified: timestamp("email_verified", { withTimezone: true, mode: 'string' }),
	passwordHash: text("password_hash"),
	image: text(),
	role: userRole().default('student').notNull(),
	collegeId: uuid("college_id"),
	phone: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	streamId: uuid("stream_id"),
}, (table) => [
	foreignKey({
			columns: [table.streamId],
			foreignColumns: [streams.id],
			name: "users_stream_id_streams_id_fk"
		}).onDelete("set null"),
	unique("users_email_unique").on(table.email),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	actorId: uuid("actor_id"),
	action: text().notNull(),
	target: text(),
	meta: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [users.id],
			name: "audit_logs_actor_id_users_id_fk"
		}),
]);

export const formTemplates = pgTable("form_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	isDefault: boolean("is_default").default(false).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	rules: jsonb().default([]).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "form_templates_created_by_users_id_fk"
		}),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	assessmentId: uuid("assessment_id"),
	amount: integer().notNull(),
	currency: text().default('INR').notNull(),
	razorpayOrderId: text("razorpay_order_id"),
	razorpayPaymentId: text("razorpay_payment_id"),
	razorpaySignature: text("razorpay_signature"),
	status: paymentStatus().default('created').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "payments_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [assessments.id],
			name: "payments_assessment_id_assessments_id_fk"
		}),
	unique("payments_razorpay_order_id_unique").on(table.razorpayOrderId),
]);

export const scores = pgTable("scores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assessmentId: uuid("assessment_id").notNull(),
	total: integer().notNull(),
	level: readinessLevel().notNull(),
	breakdown: jsonb().notNull(),
	track: text().notNull(),
	reportPdfKey: text("report_pdf_key"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [assessments.id],
			name: "scores_assessment_id_assessments_id_fk"
		}).onDelete("cascade"),
	unique("scores_assessment_id_unique").on(table.assessmentId),
]);

export const assessments = pgTable("assessments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	status: assessmentStatus().default('in_progress').notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	streamId: uuid("stream_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "assessments_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.streamId],
			foreignColumns: [streams.id],
			name: "assessments_stream_id_streams_id_fk"
		}).onDelete("restrict"),
]);

export const responses = pgTable("responses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assessmentId: uuid("assessment_id").notNull(),
	questionId: uuid("question_id").notNull(),
	optionId: text("option_id").notNull(),
	weight: integer().notNull(),
	max: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [assessments.id],
			name: "responses_assessment_id_assessments_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "responses_question_id_questions_id_fk"
		}),
]);

export const templateQuestions = pgTable("template_questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	templateId: uuid("template_id").notNull(),
	questionId: uuid("question_id").notNull(),
	orderIndex: integer("order_index").default(0).notNull(),
	active: boolean().default(true).notNull(),
}, (table) => [
	uniqueIndex("template_questions_uniq").using("btree", table.templateId.asc().nullsLast().op("uuid_ops"), table.questionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [formTemplates.id],
			name: "template_questions_template_id_form_templates_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "template_questions_question_id_questions_id_fk"
		}).onDelete("cascade"),
]);

export const questions = pgTable("questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	prompt: text().notNull(),
	options: jsonb().notNull(),
	active: boolean().default(true).notNull(),
	orderIndex: integer("order_index").default(0).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	streamId: uuid("stream_id").notNull(),
	sectionId: uuid("section_id"),
	competencyId: uuid("competency_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "questions_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.streamId],
			foreignColumns: [streams.id],
			name: "questions_stream_id_streams_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [sections.id],
			name: "questions_section_id_sections_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.competencyId],
			foreignColumns: [competencies.id],
			name: "questions_competency_id_competencies_id_fk"
		}).onDelete("restrict"),
]);

export const competencies = pgTable("competencies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	label: text().notNull(),
	description: text(),
	weight: integer().default(20).notNull(),
	active: boolean().default(true).notNull(),
	orderIndex: integer("order_index").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("competencies_slug_unique").on(table.slug),
]);

export const streams = pgTable("streams", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("streams_slug_unique").on(table.slug),
]);

export const sections = pgTable("sections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: sectionsEnum().notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verification_tokens_identifier_token_pk"}),
]);

export const accounts = pgTable("accounts", {
	userId: uuid("user_id").notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text("provider_account_id").notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "accounts_provider_provider_account_id_pk"}),
]);
