"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { payments, assessments } from "@/lib/db/schema";
import {
  createRazorpayOrder,
  isRazorpayConfigured,
  verifyCheckoutSignature,
  REPORT_PRICE_PAISE,
} from "@/lib/razorpay";

const verifySchema = z.object({
  assessmentId: z.string().uuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export async function createPaymentOrderAction(assessmentId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Login required" };

  const attempt = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, session.user.id)))
    .limit(1);
  if (!attempt[0]) return { ok: false as const, error: "Assessment not found" };

  const order = await createRazorpayOrder(REPORT_PRICE_PAISE, `att_${assessmentId.slice(0, 18)}`);

  await db.insert(payments).values({
    userId: session.user.id,
    assessmentId,
    amount: REPORT_PRICE_PAISE,
    currency: "INR",
    razorpayOrderId: order.id,
    status: "created",
  });

  return {
    ok: true as const,
    orderId: order.id,
    amount: order.amount,
    keyId: process.env.RAZORPAY_KEY_ID ?? "",
    testMode: order.test,
  };
}

export async function verifyPaymentAction(input: z.infer<typeof verifySchema>) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Login required" };

  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid payload" };

  const valid = verifyCheckoutSignature({
    orderId: parsed.data.razorpayOrderId,
    paymentId: parsed.data.razorpayPaymentId,
    signature: parsed.data.razorpaySignature,
  });
  if (!valid) return { ok: false as const, error: "Signature verification failed" };

  await db
    .update(payments)
    .set({
      status: "paid",
      razorpayPaymentId: parsed.data.razorpayPaymentId,
      razorpaySignature: parsed.data.razorpaySignature,
    })
    .where(eq(payments.razorpayOrderId, parsed.data.razorpayOrderId));

  return { ok: true as const };
}

/** Test/dev only: marks the latest order for an assessment paid when Razorpay isn't configured. */
export async function devMarkPaidAction(assessmentId: string) {
  if (isRazorpayConfigured()) return { ok: false as const, error: "Razorpay is live; use checkout" };
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Login required" };
  await db
    .update(payments)
    .set({ status: "paid", razorpayPaymentId: "test_dev" })
    .where(and(eq(payments.assessmentId, assessmentId), eq(payments.userId, session.user.id)));
  return { ok: true as const };
}

export async function isAssessmentPaid(assessmentId: string, userId: string): Promise<boolean> {
  const rows = await db
    .select({ status: payments.status })
    .from(payments)
    .where(and(eq(payments.assessmentId, assessmentId), eq(payments.userId, userId)));
  return rows.some((r) => r.status === "paid");
}
