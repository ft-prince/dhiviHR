"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  filters: { q: string; college: string };
  colleges: { id: string; name: string }[];
}

export function CodesFilterBar({ filters, colleges }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(filters.q);
  const [college, setCollege] = useState(filters.college);

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (college) params.set("college", college);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clear() {
    setQ(""); setCollege("");
    router.push(pathname);
  }

  const hasFilters = filters.q || filters.college;

  return (
    <form onSubmit={apply} className="flex flex-wrap gap-2 items-end rounded-2xl border border-border bg-white p-4 mb-3">
      <div className="flex-1 min-w-44">
        <label className="text-xs font-semibold text-ink-soft">Search</label>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Batch label…" className="mt-1" />
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-soft">College</label>
        <select
          value={college}
          onChange={(e) => setCollege(e.target.value)}
          className="mt-1 block rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All colleges</option>
          {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">Apply</Button>
        {hasFilters && <Button type="button" size="sm" variant="ghost" onClick={clear}>Clear</Button>}
      </div>
    </form>
  );
}
