"use server";

import { db } from "@/lib/db";
import {z} from "zod";
import {eq, asc, and, desc, isNotNull} from "drizzle-orm"
import {trial_questions} from "@/lib/db/schema";
import { TrialQuestion } from "@/lib/types/rules";

const responseSchema = z.object({
  questionId: z.string().uuid(),
  sectionId: z.string().uuid(),
  value: z.string(),
})

const submitSchema = z.object({
  questionIds: z.array(z.string().uuid()),
  responses: z.array(responseSchema),
})

export async function getTrialQuestionsAction(): Promise<TrialQuestion[]> {
    const questions = await db.select()
    .from(trial_questions)
    .where(isNotNull(trial_questions.sectionId)) 
    .orderBy(asc(trial_questions.orderIndex));

    return questions as TrialQuestion[];
}

export async function submitTrialResponsesAction(input: z.infer<typeof submitSchema>){
  // for now, just log the input. In the future, this will save the responses to the database and trigger any necessary workflows (e.g. scoring, notifications, etc.)
  // call calculate trial score function
  // return score to frontend to display to candidate, done
  console.log("Trial responses submitted:", input);
}
