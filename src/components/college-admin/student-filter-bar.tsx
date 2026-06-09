"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PaymentStatus = "paid" | "unpaid";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "PAID",
  unpaid: "UNPAID",
};

export function StudentsFilterBar({ filters, streams }: { filters: { q: string; streamId: string; paid: PaymentStatus | "" }; streams: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(filters.q);
  const [streamId, setStreamId] = useState(filters.streamId);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">(filters.paid);
  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (streamId) params.set("streamId", streamId);
    if (paymentStatus) params.set("paymentStatus", paymentStatus);
    
    router.push(`${pathname}?${params.toString()}`);
  }

  function clear() {
    setQ("");
    setStreamId("");
    setPaymentStatus("");
    router.push(pathname);
  }

  return (
    <form onSubmit={apply} className="flex flex-wrap gap-2 items-end rounded-2xl border border-border bg-white p-4 mb-6">
      <div className="flex-1 min-w-44">
        <label className="text-xs font-semibold text-ink-soft">Search</label>
        <Input 
          value={q} 
          onChange={(e) => setQ(e.target.value)} 
          placeholder="Search by name or email…" 
          className="mt-1" 
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-soft">Stream</label>
        <select
          value={streamId}
          onChange={(e) => setStreamId(e.target.value)}
          className="mt-1 block rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
         <option value="">All Streams</option>
         {streams.map((stream) => (
           <option key={stream.id} value={stream.id}>
             {stream.name}
           </option>
         ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-ink-soft">All Status</label>
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus | "")}
          className="mt-1 block rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Payments</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">Apply</Button>
        {(filters.q || filters.streamId || filters.paid) && (
          <Button type="button" size="sm" variant="ghost" onClick={clear}>
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}