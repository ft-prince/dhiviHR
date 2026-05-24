"use client";

import { useState } from "react";
import { fmtDate, fmtTime } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/admin/data-table";

interface Row {
  id: string;
  action: string;
  target: string | null;
  meta: unknown;
  createdAt: Date;
  actor: string | null;
  actorEmail: string | null;
}

export function ActivityLogClient({
  rows,
  filters,
  actionOptions,
}: {
  rows: Row[];
  filters: { q: string; action: string };
  actionOptions: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(filters.q);
  const [action, setAction] = useState(filters.action);

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (action) params.set("action", action);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clear() {
    setQ(""); setAction("");
    router.push(pathname);
  }

  const hasFilters = filters.q || filters.action;

  return (
    <div className="space-y-3">
      <form onSubmit={apply} className="flex flex-wrap gap-2 items-end rounded-2xl border border-border bg-white p-4">
        <div className="flex-1 min-w-0 sm:min-w-44 w-full sm:w-auto">
          <label className="text-xs font-semibold text-ink-soft">Search</label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Action or target ID…" className="mt-1" />
        </div>
        <div className="w-full sm:w-auto">
          <label className="text-xs font-semibold text-ink-soft">Action type</label>
          <select value={action} onChange={(e) => setAction(e.target.value)} className="mt-1 block w-full sm:w-auto rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">All actions</option>
            {actionOptions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button type="submit" size="sm">Apply</Button>
          {hasFilters && <Button type="button" size="sm" variant="ghost" onClick={clear}>Clear</Button>}
        </div>
      </form>

      <DataTable
        rows={rows}
        emptyText="No activity matches the current filters."
        columns={[
          { key: "when", header: "When", render: (r) => (
            <div className="text-xs">
              <div>{fmtDate(r.createdAt)}</div>
              <div className="text-ink-soft">{fmtTime(r.createdAt)}</div>
            </div>
          )},
          { key: "actor", header: "Actor", render: (r) => (
            <div>
              <div className="font-medium text-ink text-sm">{r.actor ?? "system"}</div>
              <div className="text-xs text-ink-soft">{r.actorEmail ?? ""}</div>
            </div>
          )},
          { key: "action", header: "Action", render: (r) => (
            <span className="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-xs font-bold">{r.action}</span>
          )},
          { key: "target", header: "Target", render: (r) => (
            <code className="text-xs text-ink-soft">{r.target ?? "—"}</code>
          )},
          { key: "meta", header: "Details", render: (r) =>
            r.meta ? <code className="text-xs text-ink-soft">{JSON.stringify(r.meta).slice(0, 60)}</code> : null
          },
        ]}
      />
    </div>
  );
}
