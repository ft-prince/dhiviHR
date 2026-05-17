"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { customAlphabet } from "nanoid";
import { db } from "@/lib/db";
import {
  colleges,
  accessCodeBatches,
  accessCodes,
  questions,
  users,
} from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import type { Competency } from "@/lib/scoring";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const code = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  if (!["client_admin", "super_admin"].includes(session.user.role)) throw new Error("FORBIDDEN");
  return session.user;
}

const collegeSchema = z.object({
  name: z.string().min(2),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
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
    })
    .returning();
  await audit({ actorId: me.id, action: "college.create", target: row.id, meta: { name: row.name } });
  revalidatePath("/admin/colleges");
  return { ok: true as const, id: row.id };
}

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

const questionSchema = z.object({
  id: z.string().uuid().optional(),
  competency: z.enum([
    "communication_confidence",
    "problem_solving",
    "teamwork_leadership",
    "initiative_growth",
    "interview_readiness",
  ]),
  prompt: z.string().min(5),
  options: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), weight: z.number().int().min(0).max(4) })).min(2).max(6),
  orderIndex: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export async function upsertQuestionAction(input: z.infer<typeof questionSchema>) {
  const me = await requireAdmin();
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const data = parsed.data;
  if (data.id) {
    await db
      .update(questions)
      .set({
        competency: data.competency as Competency,
        prompt: data.prompt,
        options: data.options,
        orderIndex: data.orderIndex,
        active: data.active,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, data.id));
    await audit({ actorId: me.id, action: "question.update", target: data.id });
  } else {
    const [row] = await db
      .insert(questions)
      .values({
        competency: data.competency as Competency,
        prompt: data.prompt,
        options: data.options,
        orderIndex: data.orderIndex,
        active: data.active,
        createdBy: me.id,
      })
      .returning();
    await audit({ actorId: me.id, action: "question.create", target: row.id });
  }
  revalidatePath("/admin/questions");
  return { ok: true as const };
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
