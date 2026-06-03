  "use client";

  import { useState, useTransition } from "react";
  import { fmtDate } from "@/lib/utils";
  import { useRouter, usePathname } from "next/navigation";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { DataTable } from "@/components/admin/data-table"
  import { DeleteButton } from "@/components/admin/delete-button";
  import { updateStreamAction, deleteStreamAction } from "@/lib/admin/actions";

  interface Stream {
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
      updatedAt: Date;
    }

  interface Filters { q: string }

    export function StreamsTable({
        streams,
        filters,
        exportHref,
    }:{streams: Stream[], filters: Filters, exportHref: string}) {
        const router = useRouter();
        const pathname = usePathname();
        const [editingId, setEditingId] = useState<string | null>(null);

        const [q, setQ] = useState(filters.q);

        function applyFilters(e?: React.FormEvent){
            e?.preventDefault();
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            params.set("page", "1");
            router.push(`${pathname}?${params.toString()}`);
        }

        function clearFilters(){
            router.push(pathname);
        }

        const hasFilters = filters.q;
        return(
            <div className="space-y-3">
                {/*Filter bar*/}
                <form onSubmit={applyFilters} className="flex flex-wrap gap-2 items-end rounded-2xl border  border-border bg-white p-4">
                    <div className="flex-1 min-w-44">
                        <label className="text-xs font-semibold text-ink-soft">Search</label>
                        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name..." className="mt-1" />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" size="sm">Apply</Button>
                        {hasFilters && <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>Clear</Button>}
                        <a href={exportHref} download="streams.csv">
                            <Button type="button" size="sm" variant="outline">
                                Export
                            </Button>
                        </a>
                    </div>
                </form>

                <DataTable
                    rows={streams}
                    emptyText="No streams match the current filters."
                    columns={[
                        {key: "name", header: "Name", render: (s) => (
                            <div><div className="font-medium text-ink">{s.name ?? "—"}</div><div className="text-xs text-ink-soft">{s.slug}</div></div>
                        )},
                        {key: "actions", header: "", render: (s) => (
                                <div className="flex gap-1 justify-end">
                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(editingId === s.id ? null : s.id)}>Edit</Button>
                                    <DeleteButton label="Delete" onDelete={() => deleteStreamAction(s.id)}/>
                                </div>
                        )},
                    ]}
                />
            </div>
        )
    }