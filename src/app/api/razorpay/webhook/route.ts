import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 400 });
  }
  let body: { event?: string; payload?: { payment?: { entity?: { order_id?: string; id?: string } } } };
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const event = body.event;
  const orderId = body.payload?.payment?.entity?.order_id;
  const paymentId = body.payload?.payment?.entity?.id;
  if (!orderId) return NextResponse.json({ ok: true, ignored: true });

  if (event === "payment.captured" || event === "order.paid") {
    await db
      .update(payments)
      .set({ status: "paid", razorpayPaymentId: paymentId ?? null })
      .where(eq(payments.razorpayOrderId, orderId));
  } else if (event === "payment.failed") {
    await db
      .update(payments)
      .set({ status: "failed" })
      .where(eq(payments.razorpayOrderId, orderId));
  }
  return NextResponse.json({ ok: true });
}
