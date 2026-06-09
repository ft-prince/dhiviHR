"use client";

import { ArrowRight } from "lucide-react";
import { TrialQuestion } from "@/lib/types/rules";
import { useState } from "react";
import { submitTrialResponsesAction } from "@/lib/trial/actions";
import { useRouter } from "next/navigation";

const SCALE_OPTIONS_BASE = [
  { label: "Never", value: "1" },
  { label: "Rarely", value: "2" },
  { label: "Sometimes", value: "3" },
  { label: "Usually", value: "4" },
  { label: "Always", value: "5" },
];

const PLACEHOLDER_QUESTIONS: TrialQuestion[] = [
  { id: "p-1", sectionId: "", active: true, prompt: "When I look at something a product, a service, an app I naturally think about how it makes money and whether it could succeed commercially.", options: SCALE_OPTIONS_BASE, orderIndex: 0, hint: null },
  { id: "p-2", sectionId: "", active: true, prompt: "After a setback, a failure, a bad grade, a rejection I am back to full effort within 48 hours.", options: SCALE_OPTIONS_BASE, orderIndex: 1, hint: null },
  { id: "p-3", sectionId: "", active: true, prompt: "When I explain a project or idea I am working on, people actually understand it and sometimes get excited about it as I am.", options: SCALE_OPTIONS_BASE, orderIndex: 2, hint: null },
  { id: "p-4", sectionId: "", active: true, prompt: "When someone criticizes my work, my first instinct is curiosity not defence.", options: SCALE_OPTIONS_BASE, orderIndex: 3, hint: null },
  { id: "p-5", sectionId: "", active: true, prompt: "I finish what I start even when the motivation is gone and no one is checking on me.", options: SCALE_OPTIONS_BASE, orderIndex: 4, hint: null },
  { id: "p-6", sectionId: "", active: true, prompt: "I use AI tools in a way that makes my work meaningfully better not just faster.", options: SCALE_OPTIONS_BASE, orderIndex: 5, hint: null },
];

/* Semantic Likert scale — idle is neutral, selected shows meaning */
const SCALE: { value: string; label: string; selBg: string; selText: string }[] = [
  { value: "1", label: "Never",     selBg: "#EF4444", selText: "#fff" },
  { value: "2", label: "Rarely",    selBg: "#F97316", selText: "#fff" },
  { value: "3", label: "Sometimes", selBg: "#EAB308", selText: "#fff" },
  { value: "4", label: "Usually",   selBg: "#10B981", selText: "#fff" },
  { value: "5", label: "Always",    selBg: "#22C55E", selText: "#fff" },
];

export function TrialAssessmentRunner({ questions }: { questions: TrialQuestion[] }) {
  const router = useRouter();
  const items = questions.length > 0 ? questions : PLACEHOLDER_QUESTIONS;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const answeredCount = items.filter((q) => answers[q.id] !== undefined).length;
  const total = items.length;
  const allAnswered = answeredCount === total;
  const progressPct = total > 0 ? (answeredCount / total) * 100 : 0;
  const remaining = total - answeredCount;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await submitTrialResponsesAction(answers);
      if (res.ok) {
        router.push(`/trial/result/${res.total}`);
      } else {
        setError(res.error);
        setSubmitting(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-6 sm:mt-8" onSubmit={handleSubmit}>

      {/* ── Sticky progress bar ─────────────────────────────────── */}
      <div className="sticky top-16 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between text-[12px] mb-2">
          <span className="font-medium text-ink-soft">
            {answeredCount} of {total} answered
          </span>
          {allAnswered && (
            <span className="text-brand-600 font-semibold flex items-center gap-1">
              All done — ready to submit
            </span>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-500 transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ── Question cards ───────────────────────────────────────── */}
      <div className="space-y-4 mt-6">
        {items.map((question, qi) => {
          const answered = answers[question.id] !== undefined;
          return (
            <div
              key={question.id}
              className={`rounded-2xl border p-5 sm:p-6 transition-all duration-200 ${
                answered
                  ? "border-brand-200 bg-brand-50/30"
                  : "border-gray-200 bg-white shadow-soft"
              }`}
            >
              {/* Question header */}
              <div className="flex gap-3 mb-5">
                <span
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200 ${
                    answered
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {qi + 1}
                </span>
                <p className="text-[14px] sm:text-[15px] font-medium leading-snug text-ink pt-0.5">
                  {question.prompt}
                </p>
              </div>

              {/* Scale labels */}
              <div className="flex justify-between text-[10px] text-gray-400 font-medium mb-1.5 px-0.5">
                <span>← Less likely</span>
                <span>More likely →</span>
              </div>

              {/* Likert options */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {SCALE.map((opt) => {
                  const selected = answers[question.id] === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      aria-pressed={selected}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [question.id]: opt.value }))
                      }
                      className={`flex flex-col items-center justify-center min-h-[52px] rounded-xl text-[11px] sm:text-[12px] font-medium transition-all duration-150 leading-tight px-1 ${
                        selected
                          ? "scale-[1.04] shadow-sm"
                          : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300"
                      }`}
                      style={
                        selected
                          ? {
                              background: opt.selBg,
                              color: opt.selText,
                              border: "none",
                            }
                          : undefined
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Error ───────────────────────────────────────────────── */}
      {error && (
        <p className="mt-4 text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* ── Submit ──────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <button
          type="submit"
          disabled={!allAnswered || submitting}
          className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all duration-200 ${
            allAnswered && !submitting
              ? "bg-brand-500 hover:bg-brand-600 shadow-glow cursor-pointer"
              : "bg-gray-300 cursor-not-allowed shadow-none"
          }`}
        >
          {submitting ? "Submitting…" : "See My Result"}
          {!submitting && <ArrowRight size={16} />}
        </button>
        {!allAnswered && !submitting && (
          <span className="text-[12px] text-gray-400">
            {remaining} question{remaining !== 1 ? "s" : ""} remaining
          </span>
        )}
      </div>

    </form>
  );
}
