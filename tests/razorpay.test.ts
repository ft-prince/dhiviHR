import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyCheckoutSignature, verifyWebhookSignature } from "@/lib/razorpay";

const SECRET = "test_secret_abc123";

function sign(payload: string, secret = SECRET) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

describe("razorpay.verifyCheckoutSignature", () => {
  it("accepts a valid signature", () => {
    const orderId = "order_X1Y2";
    const paymentId = "pay_A1B2";
    const signature = sign(`${orderId}|${paymentId}`);
    expect(verifyCheckoutSignature({ orderId, paymentId, signature, secret: SECRET })).toBe(true);
  });

  it("rejects a tampered signature", () => {
    const orderId = "order_X1Y2";
    const paymentId = "pay_A1B2";
    const signature = sign(`${orderId}|${paymentId}`).replace(/.$/, "0");
    expect(verifyCheckoutSignature({ orderId, paymentId, signature, secret: SECRET })).toBe(false);
  });

  it("rejects when secret is missing", () => {
    expect(
      verifyCheckoutSignature({
        orderId: "a",
        paymentId: "b",
        signature: "deadbeef",
        secret: undefined,
      }),
    ).toBe(false);
  });

  it("rejects mismatched payload", () => {
    const signature = sign("order_X1|pay_A1");
    expect(
      verifyCheckoutSignature({
        orderId: "order_X1",
        paymentId: "pay_DIFFERENT",
        signature,
        secret: SECRET,
      }),
    ).toBe(false);
  });
});

describe("razorpay.verifyWebhookSignature", () => {
  it("accepts a valid webhook signature", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: {} });
    const sig = sign(body);
    expect(verifyWebhookSignature(body, sig, SECRET)).toBe(true);
  });

  it("rejects tampered body", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const sig = sign(body);
    expect(verifyWebhookSignature(body + " ", sig, SECRET)).toBe(false);
  });

  it("rejects missing secret", () => {
    expect(verifyWebhookSignature("{}", "deadbeef", undefined)).toBe(false);
  });
});
