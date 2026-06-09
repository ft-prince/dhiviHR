"use server";

import { z } from "zod";
import { eq, and, sql, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { payments, assessments, accessGrants } from "@/lib/db/schema";
import {
  createRazorpayOrder,
  isRazorpayConfigured,
  verifyCheckoutSignature,
  REPORT_PRICE_PAISE,
} from "@/lib/razorpay";
import { sendReceiptEmail } from "../mail";
import { generateReportPdfBuffer } from "../reports/generate";


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

    try {
    const targetEmail = session.user.email;
    
    if (targetEmail) {
      // Look up corresponding assessment ID tied to this order transaction
      // (Assuming your payments table stores the associated assessmentId)
      const [paymentRecord] = await db
        .select({ assessmentId: payments.assessmentId })
        .from(payments)
        .where(eq(payments.razorpayOrderId, parsed.data.razorpayOrderId))
        .limit(1);

      if (paymentRecord?.assessmentId) {
        // Run your shared PDF generation logic using Bun/Node memory buffers
        const reportPdfBuffer = await generateReportPdfBuffer({
          assessmentId: paymentRecord.assessmentId,
          user: { id: session.user.id, name: session.user.name }
        });

        const htmlEmailBody = `
          <div style="font-family: sans-serif; line-height: 1.6; padding: 20px; color: #1e293b;">
            <h2>Your Evaluation Report is Ready! 🎉</h2>
            <p>Hi ${session.user.name || 'Candidate'},</p>
            <p>Thank you for completing your evaluation. Your payment was verified successfully.</p>
            <p>We have processed your data and generated your formal performance breakdown. Your custom analysis report has been attached to this email as a PDF document.</p>
            <p>Best regards,<br /><strong>dhiviHR Team</strong></p>
          </div>
        `;

        // Send out through your nodemailer service
        await sendReceiptEmail({
          to: targetEmail,
          subject: `Your dhiviHR Evaluation Report - Order #${parsed.data.razorpayOrderId}`,
          htmlContent: htmlEmailBody,
          pdfBuffer: reportPdfBuffer,
          pdfFilename: `dhiviHR-report-${paymentRecord.assessmentId}.pdf`
        });
      }
    }
  } catch (emailError) {
    // Caught locally so database mutations remain confirmed even if downstream mail configuration fails
    console.error("Payment verified successfully, but report email generation failed:", emailError);
  }

  return { ok: true as const };
}

export async function payUsingGrantAction(assessmentId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Login required" };
  
   const [oldest] = await db
    .select({ id: accessGrants.id })
    .from(accessGrants)
    .where(and(
      eq(accessGrants.userId, session.user.id),
      isNull(accessGrants.usedAt)
    ))
    .orderBy(accessGrants.createdAt)
    .limit(1);

    if (!oldest) return { ok: false as const, error: "No grants available" };

  const [used] = await db.update(accessGrants)
  .set({ usedAt: new Date(), usedForAssessmentId: assessmentId })
  .where(and(eq(accessGrants.id, oldest.id)))
  .returning({ id: accessGrants.id });

  if (!used) return { ok: false as const, error: "Failed to use grant" };

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
  const [byPayment] = await db
    .select({ status: payments.status })
    .from(payments)
    .where(and(eq(payments.assessmentId, assessmentId), eq(payments.userId, userId), eq(payments.status, "paid")));

  if (byPayment) return true;
  
  const [byGrant] = await db.select({ id: accessGrants.id })
    .from(accessGrants)
    .where(and(eq(accessGrants.userId, userId), eq(accessGrants.usedForAssessmentId, assessmentId)));

  return !!byGrant;
}
