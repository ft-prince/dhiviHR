"use client";

import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { getTrialQuestionsAction} from "@/lib/trial/actions";
import { TrialQuestion } from "@/lib/types/rules";

const INSTRUCTIONS = [
    "This assessment trial is designed to evaluate your skills and suitability for the role you have applied for.",
    "The trial consists of a series of questions that will test your knowledge, problem-solving abilities, and relevant skills.",
    "Please read each question carefully and provide your best answer. You may use any resources you deem necessary, but plagiarism will not be tolerated.",
    "The trial is timed, so please manage your time effectively to ensure you can complete all questions within the allotted time.",
    "Once you have completed the trial, your responses will be reviewed by our hiring team, and we will contact you with the next steps in the hiring process."
]

export default function TrialAssessmentForm(){
    const [instructionsRead, setInstructionsRead] = useState(false);
    const [questions, setQuestions] = useState<TrialQuestion[]>([]);

    async function handleStartTrial(){
      const questions = await getTrialQuestionsAction();
      setQuestions(questions);
    }

  return (
    !instructionsRead ? (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">Welcome to the dhiviHR assessment trial</h1>
      <p>Read these instructions carefully:</p>
      <p>Instructions:</p>
      {INSTRUCTIONS.map((instruction, index) => (
        <p key={index}>{index + 1}. {instruction}</p>
      ))}
      <button onClick={() => setInstructionsRead(true)}
        className="flex flex-row items-center border border-brand-500"
        >Start trial <ArrowRight className="w-4 h-4"/></button>
    </div>
  ):(
    <div>
    <button onClick={() => setInstructionsRead(false)}>back</button>
    <div>Assessment</div>
    </div>
  )

  )
}