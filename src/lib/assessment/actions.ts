"use server";

import { z } from "zod";
import { eq, and, asc, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  assessments,
  responses,
  competencies,
  questions,
  scores,
  users,
  colleges,
  formTemplates,
  templateQuestions,
  streams,
  score_competencies,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { scoreAssessment} from "@/lib/scoring";
import { generatePdfData } from "@/lib/report";

type AssessmentQuestion = {
  id: string;
  streamId: string;
  competencyId: string;
  prompt: string;
  options: any;
  active: boolean;
  orderIndex: number;
};

const QUESTION_FIELDS = {
  id: questions.id,
  streamId: questions.streamId,
  competencyId: questions.competencyId,
  competency: competencies.label,
  prompt: questions.prompt,
  options: questions.options,
  active: questions.active,
  orderIndex: questions.orderIndex,
};

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
    .innerJoin(templateQuestions, eq(templateQuestions.templateId, formTemplates.id)) 
    .where(and(eq(formTemplates.isDefault, true), eq(templateQuestions.active, true)))
    .limit(1);

  return def?.id ?? null;
}

/**
 * The exact set of questions for a user's assessment. Only questions explicitly
 * attached to the resolved template (and active in both the template and the
 * question bank) are returned — no global questions are merged in. Falls back to
 * all active questions only when no template is configured anywhere.
 */
async function resolveAssessmentQuestions(userId: string): Promise<any[]> {
  const templateId = await resolveTemplateIdForUser(userId);

  if (!templateId) {
    return db
      .select(QUESTION_FIELDS)
      .from(questions)
      .innerJoin(users, eq(users.streamId, questions.streamId))
      .innerJoin(competencies, eq(competencies.id, questions.competencyId)) // 👈 Add this join loop
      .where(
        and(
          eq(users.id, userId),
          eq(questions.active, true)
        )
      )
      .orderBy(asc(questions.orderIndex));
  }

  return db
    .select(QUESTION_FIELDS)
    .from(templateQuestions)
    .innerJoin(questions, eq(templateQuestions.questionId, questions.id))
    .innerJoin(competencies, eq(competencies.id, questions.competencyId)) // 👈 Add this join loop here too
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
  const dbUser = await db.select({streamId: users.streamId}).from(users).where(eq(users.id, user.id)).limit(1);
  
  const streamId = dbUser[0]?.streamId;
  if (!streamId) throw new Error("User stream not set. Contact administrator.");
  // Reuse the most recent in_progress attempt for this user, else create.
  const open = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.userId, user.id),eq(assessments.streamId, streamId),eq(assessments.status, "in_progress")))
    .orderBy(desc(assessments.startedAt))
    .limit(1);
  const attempt =
    open[0] ??
    (
      await db
        .insert(assessments)
        .values({ userId: user.id, streamId, status: "in_progress" })
        .returning()
    )[0];
  redirect(`/assessment/${attempt.id}`);
}

export async function submitAssessmentAction(input: z.infer<typeof submitSchema>) {
  const user = await requireUser();
  const dbUserData = await db.select({
    streamId: users.streamId,
    email: users.email,
    name: users.name,
    streamName: streams.name,
  }).from(users)
  .leftJoin(streams, eq(streams.id, users.streamId))
  .where(eq(users.id, user.id)).limit(1);

  const userData = dbUserData[0];
  if(!userData || !userData.streamId){
    throw new Error("User stream not set or profile invalid. Contact administrator."); 
  }

  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid payload" };
  const { assessmentId, answers } = parsed.data;

  const compLabels = await db.select({ id: competencies.id, label: competencies.label }).from(competencies);
  const labelMap = Object.fromEntries(compLabels.map(c => [c.id, c.label]));

  
  const attempt = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.id, assessmentId), eq(assessments.streamId, userData.streamId), eq(assessments.userId, user.id)))
    .limit(1);
  if (!attempt[0]) return { ok: false as const, error: "Assessment not found" };
  if (attempt[0].status === "completed") return { ok: false as const, error: "Already submitted" };

  // Hydrate ONLY the template's questions to compute weights server-side. Any
  // answer for a question outside the resolved template is ignored, so a stale
  // or tampered client cannot inject extra (global) questions into the score.
  const qs = await resolveAssessmentQuestions(user.id);
  const qMap = new Map(qs.map((q) => [q.id, q]));

  const scored: { competency: string; weight: number; max: number; optionId: string; questionId: string }[] = [];
  for (const a of answers) {
    const q = qMap.get(a.questionId);
    if (!q) continue;
    const opts = z.array(optionSchema).safeParse(q.options);
    if (!opts.success) continue;
    const picked = opts.data.find((o) => o.id === a.optionId);
    if (!picked) continue;
    const max = Math.max(...opts.data.map((o) => o.weight), 0);
    scored.push({
      competency: q.competencyId as string,
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

  const readableBreakdown = Object.fromEntries(
    Object.entries(result.competencyBreakdown).map(([id, detail]) => [labelMap[id] ?? id, detail])
  );

  const readableResult = { ...result, competencyBreakdown: readableBreakdown };
  const pdf_data = await generatePdfData(readableResult, userData.name || "Candidate", userData.email || "User email", userData.streamName || "Stream");

  // Upsert score row.
  await db.delete(scores).where(eq(scores.assessmentId, assessmentId));
  const [score] = await db.insert(scores).values({
    assessmentId,
    total: Math.round(result.total),
    level: result.level as never,
    track: result.track,
  }).returning();

  const competencyRows = Object.entries(result.competencyBreakdown).map(([compId, detail]) => ({
    scoreId: score.id,
    competencyId: compId,
    average: detail.average,
    gap: detail.gap as never,
  }));

  await db.insert(score_competencies).values(competencyRows);

  await db
    .update(assessments)
    .set({ status: "completed", completedAt: new Date(), reportJson: pdf_data || null })
    .where(eq(assessments.id, assessmentId));

  return { ok: true as const, assessmentId };
}

export async function getActiveQuestionsAction() {
  try {
    console.log("=== ACTION: ENTERED getActiveQuestionsAction ===");
    const user = await requireUser();
    console.log("=== ACTION: requireUser FOUND ===", user?.id);
    
    const questionsList = await resolveAssessmentQuestions(user.id);
    console.log("=== ACTION: resolveAssessmentQuestions FOUND ===", questionsList?.length);
    return questionsList;
  } catch (err) {
    console.error("=== ACTION: CRASHED SILENTLY ===", err);
    return [];
  }
}