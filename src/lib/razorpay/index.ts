import crypto from "node:crypto";

import {z} from "zod";
import bycrypt from "bcryptjs";
import {eq, and, sql, inArray} from "drizzle-orm";
import {revalidatePath} from "next/cache";
import {db} from "@/lib/db";
import {
    users,
    assessments,
    payments,
    bulkOrderStudents,
    accessGrants
} from "@/lib/db/schema";
import {audit} from "@/lib/audit";
import {auth} from "@/lib/auth";;
import {inngest, bulkPaidEvent} from "@/lib/inngest/client";
import {requireCollegeAdmin} from "@/lib/college-admin/actions";

export const REPORT_PRICE_PAISE = parseInt(process.env.REPORT_PRICE_PAISE || "19900"); // ₹199

/** Test-mode flag: when Razorpay keys are absent we let the backend auto-mark paid so dev/QA isn't blocked. */
export function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export async function createRazorpayOrder(amountPaise: number, receipt: string) {
  if (!isRazorpayConfigured()) {
    return { id: `order_test_${receipt}`, amount: amountPaise, currency: "INR" as const, test: true };
  }
  // Lazy import: razorpay is a node-only SDK and shouldn't touch the edge bundle.
  const Razorpay = (await import("razorpay")).default;
  const client = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
  const order = await client.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
  });
  return { id: order.id, amount: amountPaise, currency: "INR" as const, test: false };
}

/**
 * Verifies the signature returned by the Razorpay checkout callback.
 * Spec: HMAC-SHA256( razorpay_order_id + "|" + razorpay_payment_id, key_secret )
 */
export function verifyCheckoutSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret?: string;
}): boolean {
  const secret = params.secret ?? process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  return safeEqual(expected, params.signature);
}

/**
 * Verifies the webhook signature header against the raw request body.
 * Spec: HMAC-SHA256( rawBody, webhookSecret )
 */
export function verifyWebhookSignature(rawBody: string, signature: string, secret?: string): boolean {
  const key = secret ?? process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!key) return false;
  const expected = crypto.createHmac("sha256", key).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export async function createBulkOrdersAction(studentIds: string[]){
    const me = await requireCollegeAdmin();
    if (!studentIds.length) return { ok: false as const, error: "No students selected" };

    // create razorpay order
    const amount = studentIds.length * REPORT_PRICE_PAISE;
    const order = await createRazorpayOrder(amount,
        `bulk_${Date.now()}`);

    const [payment] = await db.insert(payments).values({
        userId: me,
        amount,
        razorpayOrderId: order.id,
        status: "created",
        isBulk: true,
        paidBy: me,
        paymentMode: "college_admin"
    }).returning({id: payments.id, orderId: payments.razorpayOrderId});

    const created = await db
    .insert(bulkOrderStudents)
    .values(studentIds.map(id => ({
        orderId: payment.id,
        studentId: id,
    }))).returning({id: bulkOrderStudents.id});

    return { ok: true as const, orderId: order.id, amount, paymentId: payment.id, keyId: process.env.RAZORPAY_KEY_ID, testMode: order.test };
    }

    export async function verifyBulkPaymentAction({
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            paymentId,
        }: {
            razorpayOrderId: string;
            razorpayPaymentId: string;
            razorpaySignature: string;
            paymentId: string;
        }){
            const me = await requireCollegeAdmin();
            const valid = verifyCheckoutSignature({orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature});
            if (!valid) return { ok: false as const, error: "Signature verification failed" };
    
            await db.update(payments).set({
                status: "paid",
                razorpayPaymentId,
                razorpaySignature,
            }).where(eq(payments.id, paymentId));
    
            const grantStudents = await db
                .select({ studentId: bulkOrderStudents.studentId })
                .from(bulkOrderStudents)
                .where(eq(bulkOrderStudents.orderId, paymentId));
    
            const createdGrants = await db.insert(accessGrants).values(
                grantStudents.map((s) => ({
                    userId: s.studentId,
                    grantedBy: me,
                    paymentId: paymentId,
                })));
    
            const studentDetails = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                collegeName: users.collegeName,
                phone: users.phone,
            }).from(users)
            .where(inArray(users.id, grantStudents.map(s => s.studentId)));
    
            await inngest.send(bulkPaidEvent.create({
                    students: studentDetails.map((s) => ({
                        id: s.id,
                        name: s.name ?? "Student",
                        email: s.email,
                        collegeName: s.collegeName ?? "your college",
                        password: `${s.name?.trim().toLowerCase().replace(/\s+/g, "").slice(0, 4)}${s.phone?.slice(-4)}`,
                    }))
                }
            )
        );
            
    
            await audit({actorId: me, action: "bulk-payment-verified", target: me, meta: { grantedCount: grantStudents.length, paymentId }});
    
            return { ok: true as const, count: grantStudents.length };
        }
