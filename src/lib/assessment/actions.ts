"use server";

import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assessments, responses, questions, scores } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { scoreAssessment, type Competency, COMPETENCIES } from "@/lib/scoring";

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

  // Hydrate questions to compute weights server-side (don't trust client).
  const qs = await db.select().from(questions);
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
  const qs = await db.select().from(questions).where(eq(questions.active, true));
  // Stable order: competency order then orderIndex
  const compOrder = new Map(COMPETENCIES.map((c, i) => [c as string, i]));
  return qs.sort((a, b) => {
    const ca = compOrder.get(a.competency) ?? 99;
    const cb = compOrder.get(b.competency) ?? 99;
    return ca - cb || a.orderIndex - b.orderIndex;
  });
}
