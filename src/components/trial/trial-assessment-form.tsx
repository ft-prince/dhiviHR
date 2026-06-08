"use client";

import { useEffect, useState } from "react";
import { getTrialQuestionsAction } from "@/lib/trial/actions";
import { TrialQuestion } from "@/lib/types/rules";
import { SiteHeader } from "../marketing/site-header";
import { TrialAssessmentRunner } from "./trial-assessment-runner";
import { InstructionsPopup } from "./instructions-popup";

export default function TrialAssessmentForm() {
  const [questions, setQuestions] = useState<TrialQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const q = await getTrialQuestionsAction();
        if (active) setQuestions(q);
      } catch {
        if (active) setQuestions([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <>
      <SiteHeader solid />
      {showInstructions && <InstructionsPopup onClose={() => setShowInstructions(false)} />}

      <main className="min-h-screen pt-20 sm:pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">

          {/* Page hero */}
          <div className="pt-6 sm:pt-10 pb-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 mb-3">
              CRAFTe Trial
            </p>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-ink">
              Your CRAFTe Driving Test
            </h1>
            <p className="mt-2 text-[14px] sm:text-[15px] text-ink-soft leading-relaxed">
              Six quick questions. Rate each one honestly from Never to Always.
            </p>
          </div>

          {loading ? (
            <div className="mt-8 space-y-4" aria-hidden>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-soft animate-pulse">
                  <div className="flex gap-3 mb-5">
                    <div className="w-7 h-7 rounded-full bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                      <div className="h-4 bg-gray-100 rounded-full w-1/2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[0,1,2,3,4].map((j) => (
                      <div key={j} className="h-12 bg-gray-100 rounded-xl" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <TrialAssessmentRunner questions={questions} />
          )}

        </div>
      </main>
    </>
  );
}
