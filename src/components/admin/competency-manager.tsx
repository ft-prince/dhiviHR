"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  createCompetencyAction,
  updateCompetencyAction,
  deleteCompetencyAction,
} from "@/lib/admin/actions";

interface Row {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  weight: number;
  active: boolean;
  orderIndex: number;
  questionCount: number;
}

const EMPTY = { slug: "", label: "", description: "", weight: 20, orderIndex: 0, active: true };

function CompetencyForm({
  initial,
  onDone,
}: {
  initial?: Row;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [v, setV] = useState({
    slug: initial?.slug ?? "",
    label: initial?.label ?? "",
    description: initial?.description ?? "",
    weight: initial?.weight ?? 20,
    orderIndex: initial?.orderIndex ?? 0,
    active: initial?.active ?? true,
  });

  const set = (k: keyof typeof v, val: unknown) => setV((p) => ({ ...p, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const res = initial
        ? await updateCompetencyAction({ id: initial.id, ...v })
        : await createCompetencyAction(v);
      if (res.ok) { router.refresh(); onDone(); }
      else setErr(res.error ?? "Save failed");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 pt-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-ink-soft">Slug <span className="text-ink-soft font-normal">(unique key, cannot change after use)</span></label>
          <Input
            value={v.slug}
            onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
            placeholder="e.g. critical_thinking"
            required
            disabled={!!initial}
            className="mt-1 font-mono text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-soft">Display Label</label>
          <Input value={v.label} onChange={(e) => set("label", e.target.value)} placeholder="e.g. Critical Thinking" required className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-soft">Weight (score points)</label>
          <Input type="number" min={1} max={100} value={v.weight} onChange={(e) => set("weight", Number(e.target.value))} className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-soft">Order</label>
          <Input type="number" min={0} value={v.orderIndex} onChange={(e) => set("orderIndex", Number(e.target.value))} className="mt-1" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-ink-soft">Description (optional)</label>
          <Input value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="What this competency measures…" className="mt-1" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="comp-active" checked={v.active} onChange={(e) => set("active", e.target.checked)} />
        <label htmlFor="comp-active" className="text-sm text-ink">Active</label>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : initial ? "Save" : "Add Competency"}</Button>
      </div>
    </form>
  );
}

export function CompetencyManager({ initialRows }: { initialRows: Row[] }) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalWeight = initialRows.reduce((s, r) => s + r.weight, 0);

  return (
    <div className="space-y-4">
      {/* Weight summary */}
      <div className="rounded-2xl border border-border bg-white p-4 flex items-center justify-between">
        <div className="text-sm text-ink">
          <b>{initialRows.filter((r) => r.active).length}</b> active competencies ·{" "}
          <b>{totalWeight}</b> total weight points
          {totalWeight !== 100 && (
            <span className="ml-2 text-amber-600 text-xs font-semibold">
              ⚠ Weights don't sum to 100 — scores will be normalised automatically
            </span>
          )}
        </div>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>+ Add Competency</Button>
        )}
      </div>

      {creating && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
          <h3 className="font-semibold text-sm text-ink">New Competency</h3>
          <CompetencyForm onDone={() => setCreating(false)} />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-white overflow-hidden">
        {initialRows.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-soft">No competencies yet.</p>
        ) : (
          initialRows.map((row) => (
            <div key={row.id} className="border-b border-border last:border-0">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-ink">{row.label}</span>
                    <code className="text-xs bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">{row.slug}</code>
                    {!row.active && <span className="text-xs text-ink-soft bg-ink-soft/10 px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  {row.description && <p className="text-xs text-ink-soft mt-0.5">{row.description}</p>}
                  <p className="text-xs text-ink-soft mt-0.5">
                    Weight: <b>{row.weight}</b> pts · {row.questionCount} question{row.questionCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(editingId === row.id ? null : row.id)}>
                    {editingId === row.id ? "Cancel" : "Edit"}
                  </Button>
                  <DeleteButton
                    label="Delete"
                    onDelete={() => deleteCompetencyAction(row.id)}
                    disabled={row.questionCount > 0}
                  />
                </div>
              </div>
              {editingId === row.id && (
                <div className="px-5 pb-4 bg-brand-50/30">
                  <CompetencyForm initial={row} onDone={() => setEditingId(null)} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
