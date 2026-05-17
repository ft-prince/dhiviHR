"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleQuestionActiveAction } from "@/lib/admin/actions";

export function QuestionRow({
  id,
  prompt,
  active,
  orderIndex,
  options,
}: {
  id: string;
  prompt: string;
  active: boolean;
  orderIndex: number;
  options: { id: string; label: string; weight: number }[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      await toggleQuestionActiveAction(id);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-ink-soft">
            <span className="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 font-bold">#{orderIndex || "—"}</span>
            <span className={`rounded-full px-2 py-0.5 font-bold ${active ? "bg-brand-500 text-white" : "bg-ink-soft/20 text-ink-soft"}`}>
              {active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="mt-2 font-medium text-ink">{prompt}</div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Hide" : "Options"}
          </Button>
          <Button size="sm" variant={active ? "outline" : "default"} onClick={toggle} disabled={pending}>
            {pending ? "…" : active ? "Disable" : "Enable"}
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="mt-4 grid sm:grid-cols-2 gap-2">
          {options.map((o) => (
            <div key={o.id} className="rounded-lg border border-border bg-brand-50/40 px-3 py-2 text-sm flex justify-between">
              <span className="text-ink">{o.label}</span>
              <span className="text-brand-700 font-bold">{o.weight}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
