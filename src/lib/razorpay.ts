import crypto from "node:crypto";
import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export function isRazorpayConfigured(): boolean {
  return Boolean(keyId && keySecret);
}

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay | null {
  if (!isRazorpayConfigured()) return null;
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId as string,
      key_secret: keySecret as string,
    });
  }
  return razorpayInstance;
}

export async function createRazorpayOrder({
  amountInr,
  receipt,
  notes,
}: {
  amountInr: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string } | null> {
  const rzp = getRazorpayClient();
  if (!rzp) return null;

  const order = await rzp.orders.create({
    amount: Math.round(amountInr * 100), // amount in paise
    currency: "INR",
    receipt: receipt.slice(0, 40),
    notes: notes || {},
  });

  return {
    id: order.id,
    amount: typeof order.amount === "number" ? order.amount : Number(order.amount),
    currency: order.currency,
  };
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!keySecret) return false;
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body.toString())
    .digest("hex");
  return expectedSignature === signature;
}
