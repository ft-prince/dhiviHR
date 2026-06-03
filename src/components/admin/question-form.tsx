"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertQuestionAction } from "@/lib/admin/actions";

interface Option {
  id: string;
  label: string;
  weight: number;
}

type QuestionData = {
  sectionId?: string | null;
  competencyId: string;
  prompt: string;
  options: Option[];
  active: boolean;
  orderIndex: number;
};

interface CompetencyOption {
  id: string;
  slug: string;
  label: string;
}

interface QuestionFormProps {
  initial?: { id: string } & QuestionData;
  createAction?: (data: QuestionData) => Promise<{ ok: boolean; error?: string }>;
  onDone?: () => void;
  competencies?: CompetencyOption[];
}

function generateOptionId() {
  return Math.random().toString(36).slice(2, 7);
}

export function QuestionForm({ initial, createAction, onDone, competencies }: QuestionFormProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [sectionId, setSectionId] = useState<string | null>(null);
  const [competencyId, setCompetencyId] = useState<string>(initial?.competencyId ?? competencies?.[0]?.id ?? "");
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [orderIndex, setOrderIndex] = useState(initial?.orderIndex ?? 0);
  const [active, setActive] = useState(initial?.active ?? true);
  const [options, setOptions] = useState<Option[]>(
    initial?.options ?? [
      { id: generateOptionId(), label: "", weight: 1 },
      { id: generateOptionId(), label: "", weight: 2 },
      { id: generateOptionId(), label: "", weight: 3 },
      { id: generateOptionId(), label: "", weight: 4 },
    ],
  );

  function updateOption(idx: number, field: keyof Option, value: string | number) {
    setOptions((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o)),
    );
  }

  function addOption() {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, { id: generateOptionId(), label: "", weight: 0 }]);
  }

  function removeOption(idx: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (prompt.trim().length < 5) {
      setError("Prompt must be at least 5 characters long.");
      return;
    }
    const data: QuestionData = { sectionId, competencyId, prompt, options, active, orderIndex };
    start(async () => {
      const result = createAction
        ? await createAction(data)
        : await upsertQuestionAction({ id: initial?.id, ...data });
      if (result.ok) {
        router.refresh();
        onDone?.();
      } else {
        setError(result.error ?? "Save failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-ink-soft">Competency</label>
          <select
            value={competencyId}
            onChange={(e) => setCompetencyId(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select a competency</option>
            {competencies?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-soft">Order Index</label>
          <Input
            type="number"
            min={0}
            value={orderIndex}
            onChange={(e) => setOrderIndex(Number(e.target.value))}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-soft">Question Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          required
          className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          placeholder="Enter the question text…"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-ink-soft">Options (weight 0–4)</label>
          {options.length < 6 && (
            <button type="button" onClick={addOption} className="text-xs text-brand-600 font-semibold hover:underline">
              + Add option
            </button>
          )}
        </div>
        <div className="space-y-2">
          {options.map((o, i) => (
            <div key={o.id} className="flex items-center gap-2">
              <Input
                value={o.label}
                onChange={(e) => updateOption(i, "label", e.target.value)}
                placeholder={`Option ${i + 1}`}
                required
                className="flex-1"
              />
              <Input
                type="number"
                min={0}
                max={4}
                value={o.weight}
                onChange={(e) => updateOption(i, "weight", Number(e.target.value))}
                className="w-20"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="text-xs text-destructive hover:underline shrink-0"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-ink-soft">Weight: 0 = lowest, 4 = highest readiness signal.</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="active"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="active" className="text-sm text-ink">
          Active (visible to candidates)
        </label>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        {onDone && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : initial ? "Save Changes" : "Create Question"}
        </Button>
      </div>
    </form>
  );
}
