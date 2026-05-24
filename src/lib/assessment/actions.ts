"use server";

import { z } from "zod";
import { eq, and, asc, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  assessments,
  responses,
  questions,
  scores,
  users,
  colleges,
  formTemplates,
  templateQuestions,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { scoreAssessment, type Competency } from "@/lib/scoring";

type AssessmentQuestion = {
  id: string;
  competency: string;
  prompt: string;
  options: unknown;
  active: boolean;
  orderIndex: number;
};

const QUESTION_FIELDS = {
  id: questions.id,
  competency: questions.competency,
  prompt: questions.prompt,
  options: questions.options,
  active: questions.active,
  orderIndex: questions.orderIndex,
} as const;

/**
 * Resolve which template applies to a user:
 *   1. the template assigned to the user's college, else
 *   2. the platform default template.
 * Returns null when neither exists.
 */
async function resolveTemplateIdForUser(userId: string): Promise<string | null> {
  const [u] = await db
    .select({ collegeId: users.collegeId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (u?.collegeId) {
    const [c] = await db
      .select({ templateId: colleges.templateId })
      .from(colleges)
      .where(eq(colleges.id, u.collegeId))
      .limit(1);
    if (c?.templateId) return c.templateId;
  }

  const [def] = await db
    .select({ id: formTemplates.id })
    .from(formTemplates)
    .where(eq(formTemplates.isDefault, true))
    .limit(1);
  return def?.id ?? null;
}

/**
 * The exact set of questions for a user's assessment. Only questions explicitly
 * attached to the resolved template (and active in both the template and the
 * question bank) are returned — no global questions are merged in. Falls back to
 * all active questions only when no template is configured anywhere.
 */
async function resolveAssessmentQuestions(userId: string): Promise<AssessmentQuestion[]> {
  const templateId = await resolveTemplateIdForUser(userId);

  if (!templateId) {
    return db.select(QUESTION_FIELDS).from(questions).where(eq(questions.active, true));
  }

  return db
    .select(QUESTION_FIELDS)
    .from(templateQuestions)
    .innerJoin(questions, eq(templateQuestions.questionId, questions.id))
    .where(
      and(
        eq(templateQuestions.templateId, templateId),
        eq(templateQuestions.active, true),
        eq(questions.active, true),
      ),
    )
    .orderBy(asc(templateQuestions.orderIndex), asc(questions.orderIndex));
}

const optionSchema = z.object({ id: z.string(), label: z.string(), weight: z.number().int().min(0).max(4) });

const responseSchema = z.object({
  questionId: z.string().uuid(),
  optionId: z.string().min(1),
});

const submitSchema = z.object({
  assessmentId: z.string().uuid(),
  answers: z.array(responseSchema).min(1),
});

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  return session.user;
}

export async function startAssessmentAction() {
  const user = await requireUser();
  // Reuse the most recent in_progress attempt for this user, else create.
  const open = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.userId, user.id), eq(assessments.status, "in_progress")))
    .orderBy(desc(assessments.startedAt))
    .limit(1);
  const attempt =
    open[0] ??
    (
      await db
        .insert(assessments)
        .values({ userId: user.id, status: "in_progress" })
        .returning()
    )[0];
  redirect(`/assessment/${attempt.id}`);
}

export async function submitAssessmentAction(input: z.infer<typeof submitSchema>) {
  const user = await requireUser();
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid payload" };
  const { assessmentId, answers } = parsed.data;

  const attempt = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, user.id)))
    .limit(1);
  if (!attempt[0]) return { ok: false as const, error: "Assessment not found" };
  if (attempt[0].status === "completed") return { ok: false as const, error: "Already submitted" };

  // Hydrate ONLY the template's questions to compute weights server-side. Any
  // answer for a question outside the resolved template is ignored, so a stale
  // or tampered client cannot inject extra (global) questions into the score.
  const qs = await resolveAssessmentQuestions(user.id);
  const qMap = new Map(qs.map((q) => [q.id, q]));

  const scored: { competency: Competency; weight: number; max: number; optionId: string; questionId: string }[] = [];
  for (const a of answers) {
    const q = qMap.get(a.questionId);
    if (!q) continue;
    const opts = z.array(optionSchema).safeParse(q.options);
    if (!opts.success) continue;
    const picked = opts.data.find((o) => o.id === a.optionId);
    if (!picked) continue;
    const max = Math.max(...opts.data.map((o) => o.weight), 0);
    scored.push({
      competency: q.competency as Competency,
      weight: picked.weight,
      max,
      optionId: a.optionId,
      questionId: q.id,
    });
  }

  if (scored.length === 0) return { ok: false as const, error: "No valid answers" };

  // Replace any previous responses on this attempt.
  await db.delete(responses).where(eq(responses.assessmentId, assessmentId));
  await db.insert(responses).values(
    scored.map((s) => ({
      assessmentId,
      questionId: s.questionId,
      optionId: s.optionId,
      weight: s.weight,
      max: s.max,
    })),
  );

  const result = scoreAssessment(
    scored.map((s) => ({ competency: s.competency, weight: s.weight, max: s.max })),
  );

  // Upsert score row.
  await db.delete(scores).where(eq(scores.assessmentId, assessmentId));
  await db.insert(scores).values({
    assessmentId,
    total: Math.round(result.total),
    level: result.level as never,
    breakdown: result.competencyBreakdown,
    track: result.track,
  });

  await db
    .update(assessments)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(assessments.id, assessmentId));

  return { ok: true as const, assessmentId };
}

export async function getActiveQuestionsAction() {
  const user = await requireUser();
  return resolveAssessmentQuestions(user.id);
}
