"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createCodeBatchAction } from "@/lib/admin/actions";

export function CodeBatchForm({ colleges }: { colleges: { id: string; name: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await createCodeBatchAction({
        collegeId: String(fd.get("collegeId")),
        label: String(fd.get("label")),
        size: Number(fd.get("size")),
      });
      if (res.ok) {
        setOk(`✓ Batch created with ${fd.get("size")} codes.`);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else setError(res.error);
    });
  }

  if (colleges.length === 0) {
    return (
      <div className="mt-4 rounded-lg bg-brand-50/60 p-3 text-xs text-ink-muted">
        Add a college first on the Colleges page.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <div>
        <Label htmlFor="collegeId">College</Label>
        <select
          id="collegeId"
          name="collegeId"
          required
          className="flex h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-brand-500"
        >
          {colleges.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="label">Batch Label</Label>
        <Input id="label" name="label" required placeholder="e.g. Pilot Cohort 2026" />
      </div>
      <div>
        <Label htmlFor="size">Number of Codes</Label>
        <Input id="size" name="size" type="number" min={1} max={2000} required defaultValue={25} />
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}
      {ok && <div className="text-sm text-brand-700">{ok}</div>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Generating…" : "Generate Codes"}
      </Button>
    </form>
  );
}
