"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCollegeAction } from "@/lib/admin/actions";

interface College {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
}

export function CollegeEditForm({ college, onDone }: { college: College; onDone?: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({
    name: college.name,
    contactEmail: college.contactEmail ?? "",
    contactPhone: college.contactPhone ?? "",
    notes: college.notes ?? "",
  });

  function set(field: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const result = await updateCollegeAction({ id: college.id, ...values });
      if (result.ok) {
        router.refresh();
        onDone?.();
      } else {
        setError(result.error ?? "Update failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-4">
      <div>
        <label className="text-xs font-semibold text-ink-soft">Name</label>
        <Input value={values.name} onChange={(e) => set("name", e.target.value)} required className="mt-1" />
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-soft">Contact Email</label>
        <Input
          type="email"
          value={values.contactEmail}
          onChange={(e) => set("contactEmail", e.target.value)}
          className="mt-1"
          placeholder="admin@college.edu"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-soft">Contact Phone</label>
        <Input
          value={values.contactPhone}
          onChange={(e) => set("contactPhone", e.target.value)}
          className="mt-1"
          placeholder="+91 98765 43210"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-soft">Notes</label>
        <textarea
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          placeholder="Internal notes about this college…"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        {onDone && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
