"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  filters: { q: string; stream: string; competency: string; active: string };
  streams: { id: string; name: string }[];
  competencies: { id: string; slug: string; label: string }[];
}

export function QuestionsFilterBar({ filters, streams, competencies }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(filters.q);
  const [stream, setStream] = useState(filters.stream);
  const [competency, setCompetency] = useState(filters.competency);
  const [active, setActive] = useState(filters.active);

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (stream) params.set("stream", stream);
    if (competency) params.set("competency", competency);
    if (active) params.set("active", active);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clear() {
    setQ(""); setStream(""); setCompetency(""); setActive("");
    router.push(pathname);
  }

  const hasFilters = filters.q || filters.stream || filters.competency || filters.active;

  return (
    <form onSubmit={apply} className="flex flex-wrap gap-2 items-end rounded-2xl border border-border bg-white p-4">
      <div className="flex-1 min-w-44">
        <label className="text-xs font-semibold text-ink-soft">Search</label>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search question text…" className="mt-1" />
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-soft">Stream</label>
        <select
          value={stream}
          onChange={(e) => setStream(e.target.value)}
          className="mt-1 block rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All streams</option>
          {streams.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-soft">Competency</label>
        <select
          value={competency}
          onChange={(e) => setCompetency(e.target.value)}
          className="mt-1 block rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All competencies</option>
          {competencies.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-soft">Status</label>
        <select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          className="mt-1 block rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">Apply</Button>
        {hasFilters && <Button type="button" size="sm" variant="ghost" onClick={clear}>Clear</Button>}
      </div>
    </form>
  );
}
