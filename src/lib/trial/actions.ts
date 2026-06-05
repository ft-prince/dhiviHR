"use server";

import { db } from "@/lib/db";
import {z} from "zod";
import {eq, asc, and, desc, isNotNull} from "drizzle-orm"
import {trial_questions} from "@/lib/db/schema";
import { TrialQuestion } from "@/lib/types/rules";
import { scoreAssessment } from "../scoring";

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

export async function submitTrialResponsesAction(input: z.infer<typeof submitSchema>){
  const entries = Object.entries(input);
  const totalQuestions = entries.length;

  if (totalQuestions === 0) return {ok: false, error: "No responses provided."};
  
  const score = entries.reduce((sum, [_questionId, responseValue]) => { return sum + Number(responseValue)}, 0);

  const average = score / totalQuestions;

  return {ok: true, score: average};
}
