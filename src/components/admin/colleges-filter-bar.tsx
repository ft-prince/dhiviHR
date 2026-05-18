"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CollegesFilterBar({ filters }: { filters: { q: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(filters.q);

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clear() {
    setQ("");
    router.push(pathname);
  }

  return (
    <form onSubmit={apply} className="flex flex-wrap gap-2 items-end rounded-2xl border border-border bg-white p-4 mb-3">
      <div className="flex-1 min-w-44">
        <label className="text-xs font-semibold text-ink-soft">Search</label>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or slug…" className="mt-1" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">Apply</Button>
        {filters.q && <Button type="button" size="sm" variant="ghost" onClick={clear}>Clear</Button>}
      </div>
    </form>
  );
}
