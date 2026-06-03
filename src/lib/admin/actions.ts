"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { customAlphabet } from "nanoid";
import { db } from "@/lib/db";
import {
  colleges,
  accessCodeBatches,
  accessCodes,
  questions,
  responses,
  users,
  formTemplates,
  templateQuestions,
  competencies,
  streams,
} from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import type { TemplateRule } from "@/lib/types/rules";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const code = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  if (!["client_admin", "super_admin"].includes(session.user.role)) throw new Error("FORBIDDEN");
  return session.user;
}

// ─── Colleges ────────────────────────────────────────────────────────────────

const collegeSchema = z.object({
  name: z.string().min(2),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function createCollegeAction(input: z.infer<typeof collegeSchema>) {
  const me = await requireAdmin();
  const parsed = collegeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const baseSlug = slugify(parsed.data.name);
  const slug = `${baseSlug}-${code().slice(0, 4).toLowerCase()}`;
  const [row] = await db
    .insert(colleges)
    .values({
      name: parsed.data.name,
      slug,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone || null,
      notes: parsed.data.notes || null,
    })
    .returning();
  await audit({ actorId: me.id, action: "college.create", target: row.id, meta: { name: row.name } });
  revalidatePath("/admin/colleges");
  return { ok: true as const, id: row.id };
}

const collegeUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function updateCollegeAction(input: z.infer<typeof collegeUpdateSchema>) {
  const me = await requireAdmin();
  const parsed = collegeUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const { id, name, contactEmail, contactPhone, notes } = parsed.data;
  await db
    .update(colleges)
    .set({
      name,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      notes: notes || null,
      updatedAt: new Date(),
    })
    .where(eq(colleges.id, id));
  await audit({ actorId: me.id, action: "college.update", target: id, meta: { name } });
  revalidatePath("/admin/colleges");
  revalidatePath(`/admin/colleges/${id}`);
  return { ok: true as const };
}

export async function deleteCollegeAction(id: string) {
  const me = await requireAdmin();
  if (me.role !== "super_admin") return { ok: false as const, error: "Only super admins can delete colleges" };
  const [{ count: studentCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.collegeId, id));
  if (studentCount > 0) {
    return { ok: false as const, error: "Cannot delete a college that has students. Reassign students first." };
  }
  await db.delete(colleges).where(eq(colleges.id, id));
  await audit({ actorId: me.id, action: "college.delete", target: id });
  revalidatePath("/admin/colleges");
  return { ok: true as const };
}

//───Streams ────────────────────────────────────────────────────────────────────

const streamSchema = z.object({
  name: z.string().min(2),
  collegeId: z.string().uuid().optional().or(z.literal("")),
  templateId: z.string().uuid().optional().or(z.literal("")),
});

export async function createStreamAction(input: z.infer<typeof streamSchema>) {
  const me = await requireAdmin();
  const parsed = streamSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const baseSlug = slugify(parsed.data.name);
  const slug = `${baseSlug}-${code().slice(0, 4).toLowerCase()}`;
  const [row] = await db
    .insert(streams)
    .values({
      name: parsed.data.name,
      slug,
      collegeId: parsed.data.collegeId || null,
      templateId: parsed.data.templateId || null,
    })
    .returning();
  await audit({ actorId: me.id, action: "stream.create", target: row.id, meta: { name: row.name } });
  revalidatePath("/admin/streams");
  return { ok: true as const, id: row.id };
}

const streamUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  collegeId: z.string().uuid().optional().or(z.literal("")),
  templateId: z.string().uuid().optional().or(z.literal("")),
});

export async function updateStreamAction(input: z.infer<typeof streamUpdateSchema>) {
  const me = await requireAdmin();
  const parsed = streamUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const { id, name, collegeId, templateId } = parsed.data;
  await db
    .update(streams)
    .set({ name, collegeId: collegeId || null, templateId: templateId || null, updatedAt: new Date() })
    .where(eq(streams.id, id));
  await audit({ actorId: me.id, action: "stream.update", target: id, meta: { name } });
  revalidatePath("/admin/streams");
  return { ok: true as const };
}

export async function deleteStreamAction(id: string) {
  const me = await requireAdmin();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(streams)
    .where(eq(streams.id, id));
  if (count === 0) {
    return { ok: false as const, error: "Stream not found" };
  }
  await db.delete(streams).where(eq(streams.id, id));
  await audit({ actorId: me.id, action: "stream.delete", target: id });
  revalidatePath("/admin/streams");
  return { ok: true as const };
}

// ─── Access Code Batches ──────────────────────────────────────────────────────

const batchSchema = z.object({
  collegeId: z.string().uuid(),
  label: z.string().min(2),
  size: z.coerce.number().int().min(1).max(2000),
});

export async function createCodeBatchAction(input: z.infer<typeof batchSchema>) {
  const me = await requireAdmin();
  const parsed = batchSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const { collegeId, label, size } = parsed.data;
  const [batch] = await db
    .insert(accessCodeBatches)
    .values({ collegeId, label, size, createdBy: me.id })
    .returning();
  const codes = Array.from({ length: size }, () => `DH-${code()}`);
  await db.insert(accessCodes).values(codes.map((c) => ({ batchId: batch.id, collegeId, code: c })));
  await audit({ actorId: me.id, action: "codes.create", target: batch.id, meta: { size, collegeId } });
  revalidatePath("/admin/codes");
  revalidatePath(`/admin/colleges/${collegeId}`);
  return { ok: true as const, batchId: batch.id };
}

export async function deleteCodeBatchAction(batchId: string) {
  const me = await requireAdmin();
  const [batch] = await db
    .select({ id: accessCodeBatches.id, collegeId: accessCodeBatches.collegeId })
    .from(accessCodeBatches)
    .where(eq(accessCodeBatches.id, batchId))
    .limit(1);
  if (!batch) return { ok: false as const, error: "Batch not found" };
  const [{ redeemedCount }] = await db
    .select({ redeemedCount: sql<number>`count(*) FILTER (WHERE redeemed_at IS NOT NULL)::int` })
    .from(accessCodes)
    .where(eq(accessCodes.batchId, batchId));
  if (redeemedCount > 0) {
    return { ok: false as const, error: "Cannot delete a batch that has redeemed codes." };
  }
  await db.delete(accessCodeBatches).where(eq(accessCodeBatches.id, batchId));
  await audit({ actorId: me.id, action: "codes.batch_delete", target: batchId });
  revalidatePath("/admin/codes");
  revalidatePath(`/admin/colleges/${batch.collegeId}`);
  return { ok: true as const };
}

// ─── Questions ────────────────────────────────────────────────────────────────

const questionSchema = z.object({
  id: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional().nullable(),
  competencyId: z.string().uuid(),
  prompt: z.string().min(5),
  options: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        weight: z.number().int().min(0).max(4),
      }),
    )
    .min(2)
    .max(6),
  active: z.boolean().default(true),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

export async function upsertQuestionAction(input: z.infer<typeof questionSchema>) {
  const me = await requireAdmin();
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const data = parsed.data;
  if (!data.competencyId) return { ok: false as const, error: "Competency is required" };

  if (data.id) {
    await db
      .update(questions)
      .set({
        sectionId: data.sectionId ?? null,
        competencyId: data.competencyId,
        prompt: data.prompt,
        options: data.options,
        active: data.active,
        orderIndex: data.orderIndex,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, data.id));
    await audit({ actorId: me.id, action: "question.update", target: data.id });
    revalidatePath("/admin/questions");
    return { ok: true as const, id: data.id };
  } else {
    const [row] = await db
      .insert(questions)
      .values({
        sectionId: data.sectionId ?? null,
        competencyId: data.competencyId,
        prompt: data.prompt,
        options: data.options,
        orderIndex: data.orderIndex,
        active: data.active,
        createdBy: me.id,
      })
      .returning();
    await audit({ actorId: me.id, action: "question.create", target: row.id });
    revalidatePath("/admin/questions");
    return { ok: true as const, id: row.id };
  }
}

export async function createAndAddToTemplateAction(
  templateId: string,
  input: Omit<z.infer<typeof questionSchema>, "id">,
) {
  const me = await requireAdmin();
  const parsed = questionSchema.omit({ id: true }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const data = parsed.data;
  if (!data.competencyId) return { ok: false as const, error: "Competency is required" };

  const [row] = await db
    .insert(questions)
    .values({
      sectionId: data.sectionId ?? null,
      competencyId: data.competencyId,
      prompt: data.prompt,
      options: data.options,
      orderIndex: data.orderIndex,
      active: data.active,
      createdBy: me.id,
    })
    .returning();
  await db
    .insert(templateQuestions)
    .values({ templateId, questionId: row.id, orderIndex: data.orderIndex, active: true })
    .onConflictDoNothing();
  await audit({ actorId: me.id, action: "template.question_create_add", target: templateId, meta: { questionId: row.id } });
  revalidatePath("/admin/questions");
  revalidatePath(`/admin/templates/${templateId}`);
  return { ok: true as const, id: row.id };
}

/**
 * Edit a question within a specific template without affecting other templates.
 * Creates a new question record with the updated data and rewires the join row.
 */
export async function forkAndUpdateTemplateQuestionAction(
  tqId: string,
  templateId: string,
  input: Omit<z.infer<typeof questionSchema>, "id">,
) {
  const me = await requireAdmin();
  const parsed = questionSchema.omit({ id: true }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const [newQ] = await db
    .insert(questions)
    .values({
      sectionId: data.sectionId ?? null,
      competencyId: data.competencyId,
      prompt: data.prompt,
      options: data.options,
      orderIndex: data.orderIndex,
      active: data.active,
      createdBy: me.id,
    })
    .returning();

  await db
    .update(templateQuestions)
    .set({ questionId: newQ.id })
    .where(eq(templateQuestions.id, tqId));

  await audit({ actorId: me.id, action: "template.question_fork", target: templateId, meta: { newQuestionId: newQ.id } });
  revalidatePath(`/admin/templates/${templateId}`);
  return { ok: true as const, id: newQ.id };
}

export async function toggleQuestionActiveAction(id: string) {
  const me = await requireAdmin();
  const [row] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  if (!row) return { ok: false as const, error: "Not found" };
  await db.update(questions).set({ active: !row.active, updatedAt: new Date() }).where(eq(questions.id, id));
  await audit({ actorId: me.id, action: "question.toggle", target: id, meta: { active: !row.active } });
  revalidatePath("/admin/questions");
  return { ok: true as const };
}

export async function deleteQuestionAction(id: string) {
  const me = await requireAdmin();
  try {
    // Remove child rows in dependency order before the question itself so the
    // responses_question_id FK no longer blocks deletion (and we never leave
    // a partial state where the template join is gone but the question remains).
    await db.delete(responses).where(eq(responses.questionId, id));
    await db.delete(templateQuestions).where(eq(templateQuestions.questionId, id));
    await db.delete(questions).where(eq(questions.id, id));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete question";
    return { ok: false as const, error: message };
  }
  await audit({ actorId: me.id, action: "question.delete", target: id });
  revalidatePath("/admin/questions");
  return { ok: true as const };
}

// ─── Users ────────────────────────────────────────────────────────────────────

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["student", "college_student", "client_admin", "super_admin"]),
});

export async function setUserRoleAction(input: z.infer<typeof roleSchema>) {
  const me = await requireAdmin();
  if (me.role !== "super_admin") return { ok: false as const, error: "Only super admin can change roles" };
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };
  await db.update(users).set({ role: parsed.data.role }).where(eq(users.id, parsed.data.userId));
  await audit({ actorId: me.id, action: "user.role_change", target: parsed.data.userId, meta: { role: parsed.data.role } });
  revalidatePath("/admin/users");
  revalidatePath("/super/admins");
  return { ok: true as const };
}

const createAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["client_admin", "super_admin"]),
});

export async function createAdminAction(input: z.infer<typeof createAdminSchema>) {
  const me = await requireAdmin();
  if (me.role !== "super_admin") return { ok: false as const, error: "Only super admins can create admins" };
  const parsed = createAdminSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const { name, email, password, role } = parsed.data;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) return { ok: false as const, error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(password, 10);
  const [row] = await db
    .insert(users)
    .values({ name, email, passwordHash, role })
    .returning({ id: users.id });

  await audit({ actorId: me.id, action: "admin.create", target: row.id, meta: { role, email } });
  revalidatePath("/super/admins");
  return { ok: true as const };
}

const userUpdateSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  collegeId: z.string().uuid().optional().or(z.literal("")),
});

export async function updateUserAction(input: z.infer<typeof userUpdateSchema>) {
  const me = await requireAdmin();
  const parsed = userUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const { userId, name, phone, collegeId } = parsed.data;
  await db
    .update(users)
    .set({
      name: name || null,
      phone: phone || null,
      collegeId: collegeId || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  await audit({ actorId: me.id, action: "user.update", target: userId });
  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function deleteUserAction(userId: string) {
  const me = await requireAdmin();
  if (me.role !== "super_admin") return { ok: false as const, error: "Only super admins can delete users" };
  if (me.id === userId) return { ok: false as const, error: "You cannot delete your own account" };
  await db.delete(users).where(eq(users.id, userId));
  await audit({ actorId: me.id, action: "user.delete", target: userId });
  revalidatePath("/admin/users");
  return { ok: true as const };
}

// ─── Form Templates ───────────────────────────────────────────────────────────

const templateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().or(z.literal("")),
  isDefault: z.boolean().default(false),
});

export async function createTemplateAction(input: z.infer<typeof templateSchema>) {
  const me = await requireAdmin();
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  if (parsed.data.isDefault) {
    await db.update(formTemplates).set({ isDefault: false });
  }
  const [row] = await db
    .insert(formTemplates)
    .values({
      name: parsed.data.name,
      description: parsed.data.description || null,
      isDefault: parsed.data.isDefault,
      createdBy: me.id,
    })
    .returning();
  await audit({ actorId: me.id, action: "template.create", target: row.id, meta: { name: row.name } });
  revalidatePath("/admin/templates");
  return { ok: true as const, id: row.id };
}

const templateUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional().or(z.literal("")),
  isDefault: z.boolean().default(false),
});

export async function updateTemplateAction(input: z.infer<typeof templateUpdateSchema>) {
  const me = await requireAdmin();
  const parsed = templateUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const { id, name, description, isDefault } = parsed.data;
  if (isDefault) {
    await db.update(formTemplates).set({ isDefault: false }).where(eq(formTemplates.id, id));
  }
  await db
    .update(formTemplates)
    .set({ name, description: description || null, isDefault, updatedAt: new Date() })
    .where(eq(formTemplates.id, id));
  await audit({ actorId: me.id, action: "template.update", target: id });
  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${id}`);
  return { ok: true as const };
}

export async function deleteTemplateAction(id: string) {
  const me = await requireAdmin();
  await db.update(streams).set({ templateId: null }).where(eq(streams.templateId, id));
  await db.delete(formTemplates).where(eq(formTemplates.id, id));
  await audit({ actorId: me.id, action: "template.delete", target: id });
  revalidatePath("/admin/templates");
  revalidatePath("/admin/streams");
  return { ok: true as const };
}

export async function addQuestionToTemplateAction(templateId: string, questionId: string, orderIndex = 0) {
  const me = await requireAdmin();
  await db
    .insert(templateQuestions)
    .values({ templateId, questionId, orderIndex, active: true })
    .onConflictDoNothing();
  await audit({ actorId: me.id, action: "template.question_add", target: templateId, meta: { questionId } });
  revalidatePath(`/admin/templates/${templateId}`);
  return { ok: true as const };
}

export async function removeQuestionFromTemplateAction(templateId: string, questionId: string) {
  const me = await requireAdmin();
  await db
    .delete(templateQuestions)
    .where(and(eq(templateQuestions.templateId, templateId), eq(templateQuestions.questionId, questionId)));
  await audit({ actorId: me.id, action: "template.question_remove", target: templateId, meta: { questionId } });
  revalidatePath(`/admin/templates/${templateId}`);
  return { ok: true as const };
}

export async function copyTemplateFromStreamAction(sourceStreamId: string, newName: string) {
  const me = await requireAdmin();
  const [sourceStream] = await db
    .select({ templateId: streams.templateId })
    .from(streams)
    .where(eq(streams.id, sourceStreamId))
    .limit(1);
  if (!sourceStream?.templateId) {
    return { ok: false as const, error: "Source stream has no template assigned" };
  }
  const sourceQuestions = await db
    .select()
    .from(templateQuestions)
    .where(eq(templateQuestions.templateId, sourceStream.templateId));
  const [newTemplate] = await db
    .insert(formTemplates)
    .values({ name: newName, createdBy: me.id })
    .returning();
  if (sourceQuestions.length > 0) {
    await db.insert(templateQuestions).values(
      sourceQuestions.map((tq) => ({
        templateId: newTemplate.id,
        questionId: tq.questionId,
        orderIndex: tq.orderIndex,
        active: tq.active,
      })),
    );
  }
  await audit({ actorId: me.id, action: "template.copy", target: newTemplate.id, meta: { sourceStreamId } });
  revalidatePath("/admin/templates");
  return { ok: true as const, id: newTemplate.id };
}

export async function assignTemplateToStreamAction(streamId: string, templateId: string | null) {
  const me = await requireAdmin();
  await db
    .update(streams)
    .set({ templateId: templateId || null, updatedAt: new Date() })
    .where(eq(streams.id, streamId));
  await audit({ actorId: me.id, action: "stream.template_assign", target: streamId, meta: { templateId } });
  revalidatePath("/admin/streams");
  revalidatePath("/admin/templates");
  return { ok: true as const };
}

// ─── Competencies ─────────────────────────────────────────────────────────────

const competencySchema = z.object({
  slug: z.string().min(2).max(64).regex(/^[a-z0-9_]+$/, "Slug: lowercase letters, digits, underscores only"),
  label: z.string().min(2),
  description: z.string().optional().or(z.literal("")),
  weight: z.coerce.number().int().min(1).max(100).default(20),
  orderIndex: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export async function createCompetencyAction(input: z.infer<typeof competencySchema>) {
  const me = await requireAdmin();
  const parsed = competencySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const existing = await db.select({ id: competencies.id }).from(competencies).where(eq(competencies.slug, parsed.data.slug)).limit(1);
  if (existing.length) return { ok: false as const, error: "A competency with this slug already exists" };
  const [row] = await db.insert(competencies).values(parsed.data).returning();
  await audit({ actorId: me.id, action: "competency.create", target: row.id, meta: { slug: row.slug } });
  revalidatePath("/admin/competencies");
  return { ok: true as const, id: row.id };
}

const competencyUpdateSchema = competencySchema.extend({ id: z.string().uuid() });

export async function updateCompetencyAction(input: z.infer<typeof competencyUpdateSchema>) {
  const me = await requireAdmin();
  const parsed = competencyUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const { id, ...data } = parsed.data;
  await db.update(competencies).set({ ...data, updatedAt: new Date() }).where(eq(competencies.id, id));
  await audit({ actorId: me.id, action: "competency.update", target: id });
  revalidatePath("/admin/competencies");
  revalidatePath("/admin/questions");
  return { ok: true as const };
}

export async function deleteCompetencyAction(id: string) {
  const me = await requireAdmin();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions)
    .where(eq(questions.competencyId, id));
  if (count > 0) return { ok: false as const, error: `Cannot delete — ${count} question(s) use this competency.` };
  await db.delete(competencies).where(eq(competencies.id, id));
  await audit({ actorId: me.id, action: "competency.delete", target: id });
  revalidatePath("/admin/competencies");
  return { ok: true as const };
}

// ─── Template Rules ───────────────────────────────────────────────────────────

export async function updateTemplateRulesAction(templateId: string, rules: TemplateRule[]) {
  const me = await requireAdmin();
  if (!templateId) return { ok: false as const, error: "Missing template ID" };
  await db
    .update(formTemplates)
    .set({ rules: rules as never, updatedAt: new Date() })
    .where(eq(formTemplates.id, templateId));
  await audit({ actorId: me.id, action: "template.rules_update", target: templateId, meta: { count: rules.length } });
  revalidatePath(`/admin/templates/${templateId}`);
  return { ok: true as const };
}
