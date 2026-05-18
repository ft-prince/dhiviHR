"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function Pagination({ total, page, pageSize }: { total: number; page: number; pageSize: number }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) return null;

  function href(p: number) {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(p));
    return `${pathname}?${next.toString()}`;
  }

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <span className="text-ink-soft text-xs">
        {total} record{total !== 1 ? "s" : ""} · page {page} of {totalPages}
      </span>
      <div className="flex gap-1">
        {page > 1 && (
          <Link href={href(page - 1)} className="px-3 py-1.5 rounded-md border border-border bg-white text-ink hover:bg-brand-50 text-xs">
            ← Prev
          </Link>
        )}
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-ink-soft text-xs">…</span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              className={cn(
                "px-3 py-1.5 rounded-md border text-xs",
                p === page
                  ? "border-brand-500 bg-brand-500 text-white font-bold"
                  : "border-border bg-white text-ink hover:bg-brand-50",
              )}
            >
              {p}
            </Link>
          ),
        )}
        {page < totalPages && (
          <Link href={href(page + 1)} className="px-3 py-1.5 rounded-md border border-border bg-white text-ink hover:bg-brand-50 text-xs">
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
