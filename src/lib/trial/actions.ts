"use server";

import { db } from "@/lib/db";
import {z} from "zod";
import {eq, asc, and, desc, isNotNull} from "drizzle-orm"
import {trial_questions} from "@/lib/db/schema";
import { TrialQuestion } from "@/lib/types/rules";
import { bandForTrialScore, TRIAL_ANSWER_MIN, TRIAL_ANSWER_MAX, type TrialLevel } from "./scoring";

const responseSchema = z.object({
  questionId: z.string().uuid(),
  sectionId: z.string().uuid(),
  value: z.string(),
})

const submitSchema = z.record(z.string().uuid(), z.string());

export async function getTrialQuestionsAction(): Promise<TrialQuestion[]> {
    const questions = await db.select()
    .from(trial_questions)
    .where(isNotNull(trial_questions.sectionId)) 
    .orderBy(asc(trial_questions.orderIndex));

    return questions as TrialQuestion[];
}

export type SubmitTrialResult =
  | { ok: true; total: number; count: number; level: TrialLevel; label: string }
  | { ok: false; error: string };

export async function submitTrialResponsesAction(
  input: z.infer<typeof submitSchema>,
): Promise<SubmitTrialResult> {
  const entries = Object.entries(input);
  const count = entries.length;

  if (count === 0) return { ok: false, error: "No responses provided." };

  let total = 0;
  for (const [, responseValue] of entries) {
    const n = Number(responseValue);
    if (!Number.isInteger(n) || n < TRIAL_ANSWER_MIN || n > TRIAL_ANSWER_MAX) {
      return { ok: false, error: "Each answer must be between 1 and 5." };
    }
    total += n;
  }

  const band = bandForTrialScore(total);
  return { ok: true, total, count, level: band.level, label: band.label };
}
