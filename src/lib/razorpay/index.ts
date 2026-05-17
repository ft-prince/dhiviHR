import crypto from "node:crypto";

export const REPORT_PRICE_PAISE = 19900; // ₹199

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
