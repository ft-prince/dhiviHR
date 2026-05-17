import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  jsonb,
  primaryKey,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRole = pgEnum("user_role", [
  "student",
  "college_student",
  "client_admin",
  "super_admin",
]);

export const assessmentStatus = pgEnum("assessment_status", [
  "in_progress",
  "completed",
  "abandoned",
]);

export const paymentStatus = pgEnum("payment_status", [
  "created",
  "paid",
  "failed",
  "refunded",
]);

export const readinessLevel = pgEnum("readiness_level", [
  "emerging",
  "developing",
  "industry_ready",
  "high_impact",
]);

export const competencyEnum = pgEnum("competency", [
  "communication_confidence",
  "problem_solving",
  "teamwork_leadership",
  "initiative_growth",
  "interview_readiness",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  passwordHash: text("password_hash"),
  image: text("image"),
  role: userRole("role").notNull().default("student"),
  collegeId: uuid("college_id"),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({ pk: primaryKey({ columns: [t.provider, t.providerAccountId] }) }),
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.identifier, t.token] }) }),
);

export const colleges = pgTable("colleges", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const accessCodeBatches = pgTable("access_code_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  size: integer("size").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const accessCodes = pgTable(
  "access_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id").notNull().references(() => accessCodeBatches.id, { onDelete: "cascade" }),
    collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    redeemedBy: uuid("redeemed_by").references(() => users.id),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ codeIdx: uniqueIndex("access_codes_code_unique").on(t.code) }),
);

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  competency: competencyEnum("competency").notNull(),
  prompt: text("prompt").notNull(),
  /** [{ id, label, weight }] weight 0..4 */
  options: jsonb("options").notNull(),
  active: boolean("active").notNull().default(true),
  orderIndex: integer("order_index").notNull().default(0),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: assessmentStatus("status").notNull().default("in_progress"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const responses = pgTable("responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull().references(() => questions.id),
  optionId: text("option_id").notNull(),
  weight: integer("weight").notNull(),
  max: integer("max").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scores = pgTable("scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id").notNull().unique().references(() => assessments.id, { onDelete: "cascade" }),
  total: integer("total").notNull(),
  level: readinessLevel("level").notNull(),
  breakdown: jsonb("breakdown").notNull(),
  track: text("track").notNull(),
  reportPdfKey: text("report_pdf_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assessmentId: uuid("assessment_id").references(() => assessments.id),
  amount: integer("amount").notNull(), // paise
  currency: text("currency").notNull().default("INR"),
  razorpayOrderId: text("razorpay_order_id").unique(),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  status: paymentStatus("status").notNull().default("created"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id),
  action: text("action").notNull(),
  target: text("target"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  assessments: many(assessments),
  payments: many(payments),
  college: one(colleges, { fields: [users.collegeId], references: [colleges.id] }),
}));

export const collegesRelations = relations(colleges, ({ many }) => ({
  batches: many(accessCodeBatches),
  codes: many(accessCodes),
  students: many(users),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  user: one(users, { fields: [assessments.userId], references: [users.id] }),
  responses: many(responses),
  score: one(scores, { fields: [assessments.id], references: [scores.assessmentId] }),
}));
