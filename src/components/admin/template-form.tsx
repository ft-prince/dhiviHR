"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTemplateAction, updateTemplateAction, copyTemplateFromCollegeAction } from "@/lib/admin/actions";

interface College {
  id: string;
  name: string;
}

interface TemplateFormProps {
  initial?: {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
  };
  colleges?: College[];
  onDone?: (id?: string) => void;
}

export function TemplateForm({ initial, colleges = [], onDone }: TemplateFormProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "copy">("create");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [sourceCollegeId, setSourceCollegeId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      if (mode === "copy") {
        const result = await copyTemplateFromCollegeAction(sourceCollegeId, name);
        if (result.ok) {
          router.refresh();
          onDone?.(result.id);
        } else {
          setError(result.error ?? "Copy failed");
        }
        return;
      }
      if (initial) {
        const result = await updateTemplateAction({ id: initial.id, name, description, isDefault });
        if (result.ok) { router.refresh(); onDone?.(); }
        else setError(result.error ?? "Update failed");
      } else {
        const result = await createTemplateAction({ name, description, isDefault });
        if (result.ok) { router.refresh(); onDone?.(result.id); }
        else setError(result.error ?? "Create failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!initial && colleges.length > 0 && (
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          {(["create", "copy"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 py-2 font-medium transition ${mode === m ? "bg-brand-500 text-white" : "bg-white text-ink-muted hover:bg-brand-50"}`}
            >
              {m === "create" ? "Create New" : "Copy from College"}
            </button>
          ))}
        </div>
      )}

      {mode === "copy" && colleges.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-ink-soft">Copy template from</label>
          <select
            value={sourceCollegeId}
            onChange={(e) => setSourceCollegeId(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select a college…</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-ink-soft">Template Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1"
          placeholder="e.g. Engineering Colleges 2025"
        />
      </div>

      {mode === "create" && (
        <>
          <div>
            <label className="text-xs font-semibold text-ink-soft">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Optional description…"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isDefault" className="text-sm text-ink">
              Set as default template (used when college has no template assigned)
            </label>
          </div>
        </>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        {onDone && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onDone()}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : mode === "copy" ? "Copy & Create" : initial ? "Save Changes" : "Create Template"}
        </Button>
      </div>
    </form>
  );
}
