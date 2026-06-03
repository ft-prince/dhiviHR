"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createStreamAction } from "@/lib/admin/actions";

interface Props {
  colleges?: { id: string; name: string }[];
  templates?: { id: string; name: string }[];
}

export function StreamCreateForm({ colleges = [], templates = [] }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await createStreamAction({
        name: String(fd.get("name") ?? ""),
        collegeId: String(fd.get("collegeId") ?? ""),
        templateId: String(fd.get("templateId") ?? ""),
      });
      if (res.error) {
        setError(res.error);
      } else {
        setOk(true);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <div>
        <Label htmlFor="name">Stream Name</Label>
        <Input id="name" name="name" required placeholder="e.g. Computer Science" />
      </div>
      <div>
        <Label htmlFor="collegeId">College (optional)</Label>
        <select
          id="collegeId"
          name="collegeId"
          defaultValue=""
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Global (no college)</option>
          {colleges.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="templateId">Template (optional)</Label>
        <select
          id="templateId"
          name="templateId"
          defaultValue=""
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">No template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}
      {ok && <div className="text-sm text-brand-700">Stream created.</div>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create Stream"}
      </Button>
    </form>
  );
}
