"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitAssessmentAction } from "@/lib/assessment/actions";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Q = {
  id: string;
  competency: string;
  prompt: string;
  options: { id: string; label: string; weight: number }[];
};

export function AssessmentRunner({ assessmentId, questions }: { assessmentId: string; questions: Q[] }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const q = questions[idx];
  const progress = useMemo(() => Math.round(((idx + 1) / questions.length) * 100), [idx, questions.length]);
  const answered = answers[q?.id ?? ""];

  function pick(qid: string, optionId: string) {
    setAnswers((a) => ({ ...a, [qid]: optionId }));
  }

  function submit() {
    setError(null);
    const payload = {
      assessmentId,
      answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })),
    };
    start(async () => {
      const res = await submitAssessmentAction(payload);
      if (res.ok) {
        router.push(`/report/${assessmentId}`);
      } else {
        setError(res.error);
      }
    });
  }

  if (!q) return <div>No questions available.</div>;

  const isLast = idx === questions.length - 1;
  const allAnswered = questions.every((qq) => answers[qq.id]);

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between text-xs font-medium text-ink-muted mb-2">
          {/* <span>{q.competency}</span> */}
          <span>Question {idx + 1} of {questions.length}</span>
        </div>
        <div className="h-2 rounded-full bg-brand-50 overflow-hidden">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-soft p-5 sm:p-8">
        <h2 className="normal-case text-xl sm:text-2xl md:text-3xl break-words">{q.prompt}</h2>
        <div className="mt-6 space-y-3">
          {q.options.map((o) => {
            const selected = answers[q.id] === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => pick(q.id, o.id)}
                className={cn(
                  "w-full text-left rounded-2xl sm:rounded-pill border-2 px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 transition",
                  selected
                    ? "border-brand-500 bg-brand-50 text-ink"
                    : "border-border hover:border-brand-300 hover:bg-brand-50/50 text-ink",
                )}
              >
                <span className="min-w-0">{o.label}</span>
                {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {error && <div className="mt-4 text-sm text-destructive">{error}</div>}

      <div className="mt-6 flex justify-between items-center">
        <Button variant="ghost" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {isLast ? (
          <Button onClick={submit} disabled={!allAnswered || pending}>
            {pending ? "Submitting…" : "Submit & See Report"}
          </Button>
        ) : (
          <Button onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))} disabled={!answered}>
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="mt-4 text-xs text-ink-soft text-center">
        Answered {Object.keys(answers).length} / {questions.length}
      </div>
    </div>
  );
}
