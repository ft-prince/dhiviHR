"use client";

import { ArrowRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { getTrialQuestionsAction} from "@/lib/trial/actions";
import { TrialQuestion } from "@/lib/types/rules";
import { SiteHeader } from '../marketing/site-header';
import { TrialAssessmentRunner } from './trial-assessment-runner';

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
    <>
    <SiteHeader solid />
    <main className="px-4 sm:px-8 md:px-16 lg:px-24 pt-20 sm:pt-24 pb-16">
    {!instructionsRead ? (
    <div className="max-w-3xl">
      <h1 className="display-headline text-2xl sm:text-3xl md:text-4xl normal-case">Welcome to the dhiviHR Assessment Trial</h1>
      <p className="text-ink-soft mt-1 mb-8 text-base sm:text-lg">Read the instructions carefully:</p>
      {/* <p className="font-bold mt-4">Instructions:</p> */}
      {INSTRUCTIONS.map((instruction, index) => (
        <p key={index} className="mt-2 text-ink text-base sm:text-lg">
          {index + 1}. {instruction}
        </p>
      ))}
      <button onClick={() => setInstructionsRead(true)}
        className="mt-8 px-5 py-2 rounded-full text-white text-xl bg-brand-500 flex flex-row gap-2 hover:bg-brand-600 items-center border border-brand-500"
        >Start trial <ArrowRight className="w-5 h-5"/></button>
    </div>
  ):(
    <div>
    <button onClick={() => {setInstructionsRead(false); handleStartTrial();}}
      className="mb-4 ml-4 sm:ml-0 px-3 py-2 rounded-2xl border border-black flex flex-row gap-0 items-center hover:border-brand-600 hover:text-brand-600"
      ><ChevronLeft/>Back</button>
      <h2 className="text-xl sm:text-2xl font-bold ml-4">Your CRAFTe Driving Test</h2>
      <div className="ml-4">Answer the following questions appropriately:</div>  
    <div><TrialAssessmentRunner questions={questions}/></div>
    </div>
  )}
  </main>
</>
  )
}