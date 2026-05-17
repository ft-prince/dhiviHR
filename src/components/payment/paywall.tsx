"use client";

import Script from "next/script";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createPaymentOrderAction, verifyPaymentAction, devMarkPaidAction } from "@/lib/payment/actions";
import { Lock } from "lucide-react";

declare global {
  interface Window { Razorpay?: new (opts: Record<string, unknown>) => { open(): void } }
}

export function Paywall({ assessmentId, userName, userEmail }: { assessmentId: string; userName?: string | null; userEmail?: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function pay() {
    setError(null);
    start(async () => {
      const order = await createPaymentOrderAction(assessmentId);
      if (!order.ok) return setError(order.error);

      if (order.testMode || !order.keyId) {
        // Dev/QA shortcut when Razorpay keys aren't configured
        const r = await devMarkPaidAction(assessmentId);
        if (!r.ok) return setError(r.error);
        router.refresh();
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
        prefill: { name: userName ?? "", email: userEmail ?? "" },
        theme: { color: "#22C55E" },
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const v = await verifyPaymentAction({
            assessmentId,
            razorpayOrderId: resp.razorpay_order_id,
            razorpayPaymentId: resp.razorpay_payment_id,
            razorpaySignature: resp.razorpay_signature,
          });
          if (v.ok) router.refresh();
          else setError(v.error);
        },
        modal: { ondismiss: () => setError("Payment cancelled") },
      });
      rz.open();
    });
  }

  return (
    <div className="rounded-2xl border-2 border-brand-200 bg-white shadow-card p-10 text-center">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="mx-auto h-14 w-14 rounded-full bg-brand-50 grid place-items-center text-brand-600">
        <Lock className="h-6 w-6" />
      </div>
      <h2 className="display-headline text-3xl mt-4">Unlock Your Full Report</h2>
      <p className="mt-2 text-ink-muted max-w-md mx-auto">
        Includes Readiness Score, Employability Level, Strength &amp; Improvement Areas,
        Recruiter Observation, and Growth Recommendations.
      </p>
      <div className="mt-6 display-headline text-5xl text-brand-600">₹199</div>
      <div className="mt-6">
        <Button size="lg" onClick={pay} disabled={pending}>
          {pending ? "Processing…" : "Pay & Unlock"}
        </Button>
      </div>
      {error && <div className="mt-4 text-sm text-destructive">{error}</div>}
    </div>
  );
}
