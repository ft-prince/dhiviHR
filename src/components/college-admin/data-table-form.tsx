"use client";

import Script from "next/script";
import { useState, useTransition } from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import PaymentStatusBadge from "@/components/ui/badge";
import { REPORT_PRICE_PAISE } from "@/lib/constants";
import { createBulkOrdersAction, verifyBulkPaymentAction } from "@/lib/college-admin/actions";


export interface DataTableType {
  id: string;
  name: string;
  email: string;
  streamName: string | null;
  phone: string;
  paymentStatus: string | null;
}

export function DataTableForm({
  data,
  emptyText = "No records yet",
}: {
  data: DataTableType[];
  emptyText?: string;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  //const report_price = process.env.REPORT_PRICE_PAISE;

  const uniqueStreams = Array.from(
    new Set(data.map((s) => s.streamName).filter((s): s is string => !!s))
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  const handleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : data.map((r) => r.id));
  };

  const handleSelectStream = (streamName: string) => {
    const streamIds = data
      .filter((r) => r.streamName === streamName)
      .map((r) => r.id);

    const allAlreadySelected = streamIds.every((id) => selectedIds.includes(id));
    if (allAlreadySelected) {
      setSelectedIds((prev) => prev.filter((id) => !streamIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...streamIds])));
    }
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (selectedIds.length === 0) {
      setError("Please select at least one student.");
      return;
    }

    start(async() => {
        const order = await createBulkOrdersAction(selectedIds);
        if(!order.ok) {
            setError(order.error);
            return;
        }

        if (!window.Razorpay) return setError("Razorpay SDK not loaded");
              const rz = new window.Razorpay({
                key: order.keyId,
                order_id: order.orderId,
                amount: order.amount,
                currency: "INR",
                name: "DHIVI HR",
                description: "Interview Readiness Report",
                prefill: { name: "", email: "" },
                theme: { color: "#22C55E" },
                handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
                  const v = await verifyBulkPaymentAction({
                    razorpayOrderId: resp.razorpay_order_id,
                    razorpayPaymentId: resp.razorpay_payment_id,
                    razorpaySignature: resp.razorpay_signature,
                    paymentId: order.paymentId,
                  });
                  if (v.ok) router.refresh();
                  else setError(v.error);
                },
                modal: { ondismiss: () => setError("Payment cancelled") },
              });
              rz.open();
            });
    }
    

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
        <div className="text-sm text-ink-soft">{emptyText}</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <div className="lg:col-span-3 rounded-2xl border border-border bg-white overflow-hidden self-start">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-50/70 text-ink-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer rounded border-gray-300 accent-brand-600"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Stream</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => toggleSelection(row.id)}
                    className="border-b last:border-0 border-border hover:bg-brand-50/30 transition-colors cursor-pointer"
                  >
                    <td
                      className="px-4 py-3 align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleSelection(row.id)}
                        className="w-4 h-4 cursor-pointer rounded border-gray-300 accent-brand-600" // ✅ accent color
                      />
                    </td>
                    <td className="px-4 py-3 align-middle font-medium"><div className="flex flex-col gap-0.5">
                        {row.name}
                        <span className="text-xs text-ink-soft">{row.email}</span>
                        </div></td>
                    <td className="px-4 py-3 align-middle">{row.streamName ?? "—"}</td>
                    <td className="px-4 py-3 align-middle">{row.phone}</td>
                    <td className="px-4 py-3 align-middle">
                      <PaymentStatusBadge status={row.paymentStatus === "paid" ? "Paid" : "Unpaid"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-4 sticky top-6 self-start">
          <div className="rounded-2xl border border-border bg-white px-6 pb-6 pt-4 shadow-sm">
            <h2 className="text-xl font-bold text-ink mb-4">Purchase grants</h2>

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <span className="text-sm font-medium text-ink-soft">Selected:</span>
              <span className="text-2xl font-bold text-brand-600">{selectedIds.length}</span>
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
                Quick Selects
              </p>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-auto py-2 whitespace-normal text-left"
                onClick={handleSelectAll}
              >
                {isAllSelected ? "Deselect All Students" : "Select All Students"}
              </Button>

              {uniqueStreams.map((stream) => {
                const streamIds = data
                  .filter((r) => r.streamName === stream)
                  .map((r) => r.id);
                const allSelected = streamIds.every((id) => selectedIds.includes(id));

                return (
                  <Button
                    key={stream}
                    type="button"
                    variant="outline"
                    className="w-full justify-start h-auto py-2 whitespace-normal text-left"
                    onClick={() => handleSelectStream(stream)}
                  >
                    {allSelected ? `Deselect ${stream}` : `Select All ${stream}`}
                  </Button>
                );
              })}
            </div>

           <Button
            type="submit"
            className="w-full mt-2 h-auto py-3 flex flex-col items-center gap-0.5"
            disabled={selectedIds.length === 0}
            >
            <span className="text-sm font-semibold">
                Pay {((Number(REPORT_PRICE_PAISE) * selectedIds.length) / 100).toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                })}
            </span>
            <span className="text-xs opacity-80 font-normal">
                for {selectedIds.length} Student{selectedIds.length !== 1 ? "s" : ""}
            </span>
            </Button>
           <div className="mt-2 text-sm text-ink-soft justify-center"> 
            </div>
          </div>
        </div>

      </div>
    </form>
  );
}