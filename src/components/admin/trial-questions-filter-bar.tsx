"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
    filters: { q: string; sectionId: string, active: string };
    sections: { id: string; name: string }[];
}

export function TrialQuestionsFilterBar({ filters, sections }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const [q, setQ] = useState(filters.q);
    const [sectionId, setSectionId] = useState(filters.sectionId);
    const [active, setActive] = useState(filters.active);

    function apply(e?: React.FormEvent){
        e?.preventDefault();
        const params = new URLSearchParams();
        if(q) params.set("q", q);
        if(sectionId) params.set("section", sectionId);
        if(active) params.set("active", active);
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    }

    function clear(){
        setQ(""); setSectionId(""); setActive("");
        router.push(pathname);
    }

    const hasFilters = filters.q || filters.sectionId || filters.active;

    return(
        <form onSubmit={apply} className="flex flex-wrap gap-2 items-end rounded-2xl border border-border bg-white p-4">
            <div className="flex-1 min-w-44">
                <label className="text-xs font-semibold text-ink-soft">Search</label>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search question text…" className="mt-1" />
            </div>
            <div>
                <label className="text-xs font-semibold text-ink-soft">Section</label>
                <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="mt-1 block rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">All Sections</option>
                    {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                            {section.name}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="text-xs font-semibold text-ink-soft">Status</label>
                <select value={active} onChange={(e) => setActive(e.target.value)} className="mt-1 block rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
            <div className="flex gap-2">
                <Button type="submit" size="sm">
                    Apply Filters
                </Button>
            {hasFilters && (
                <Button type="button" onClick={clear} variant="ghost" size="sm">
                    Clear Filters
                </Button>
            )}
            </div>
        </form>
    )
}