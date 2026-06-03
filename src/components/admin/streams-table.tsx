"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteStreamAction } from "@/lib/admin/actions";

interface Stream {
  id: string;
  name: string;
  slug: string;
  collegeId: string | null;
  collegeName: string | null;
  templateId: string | null;
  templateName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Filters { q: string }

export function StreamsTable({
  streams,
  filters,
}: { streams: Stream[]; filters: Filters }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(filters.q);

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    router.push(pathname);
  }

  const hasFilters = filters.q;
  return (
    <div className="space-y-3">
      <form onSubmit={applyFilters} className="flex flex-wrap gap-2 items-end rounded-2xl border border-border bg-white p-4">
        <div className="flex-1 min-w-44">
          <label className="text-xs font-semibold text-ink-soft">Search</label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name..." className="mt-1" />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm">Apply</Button>
          {hasFilters && <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>Clear</Button>}
        </div>
      </form>

      <DataTable
        rows={streams}
        emptyText="No streams match the current filters."
        columns={[
          {
            key: "name", header: "Name", render: (s) => (
              <div>
                <div className="font-medium text-ink">{s.name}</div>
                <div className="text-xs text-ink-soft">{s.slug}</div>
              </div>
            ),
          },
          {
            key: "college", header: "College", render: (s) => (
              <span className="text-sm text-ink">{s.collegeName ?? "Global"}</span>
            ),
          },
          {
            key: "template", header: "Template", render: (s) => (
              <span className="text-sm text-ink">{s.templateName ?? "None"}</span>
            ),
          },
          {
            key: "actions", header: "", render: (s) => (
              <div className="flex gap-1 justify-end">
                <DeleteButton label="Delete" onDelete={() => deleteStreamAction(s.id)} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
