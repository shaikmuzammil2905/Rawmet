import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb, syncDbFromS3, syncDbToS3 } from "@/lib/db";
import { getCurrentSession } from "@/lib/data";
import { signPaymentOrderToken } from "@/lib/auth";
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/razorpay";
import type { SubscriptionPlanRecord } from "@/lib/types";

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Please login before purchasing a subscription." }, { status: 401 });
  }

  try {
    await syncDbFromS3(true);
    const body = (await req.json()) as { planId?: number; paymentMethod?: string };
    const planId = Number(body.planId);
    if (!planId) {
      return NextResponse.json({ error: "Select a valid subscription plan." }, { status: 400 });
    }

    const db = getDb();
    const plan = db
      .prepare(`SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1`)
      .get(planId) as unknown as SubscriptionPlanRecord | undefined;

    if (!plan) {
      return NextResponse.json({ error: "Selected subscription plan not found." }, { status: 404 });
    }

    // Duplicate-payment protection: check if user already has a very recent created order for same plan within 2 minutes
    const recentOrder = db
      .prepare(
        `SELECT order_id, amount_inr FROM payments
         WHERE user_id = ? AND plan_id = ? AND status = 'created'
           AND datetime(created_at) >= datetime('now', '-2 minutes')
         ORDER BY id DESC LIMIT 1`
      )
      .get(session.user.id, plan.id) as { order_id: string; amount_inr: number } | undefined;

    const orderId = recentOrder?.order_id || `ORD_RAW_${Date.now()}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const amountInr = plan.price_inr; // Never trust price from client!
    const gstAmountInr = Math.round(amountInr - amountInr / 1.18);

    let razorpayOrder: { id: string; amount: number; currency: string } | null = null;
    if (isRazorpayConfigured()) {
      try {
        razorpayOrder = await createRazorpayOrder({
          amountInr,
          receipt: orderId,
          notes: {
            planName: plan.name,
            userId: String(session.user.id),
            userMobile: session.user.mobile,
          },
        });
      } catch (rzpErr) {
        console.error("Razorpay order creation fallback:", rzpErr);
      }
    }

    if (!recentOrder) {
      db.prepare(
        `INSERT INTO payments (order_id, user_id, plan_id, amount_inr, gst_amount_inr, status, payment_method)
         VALUES (?, ?, ?, ?, ?, 'created', ?)`
      ).run(orderId, session.user.id, plan.id, amountInr, gstAmountInr, body.paymentMethod || "Razorpay / UPI / Card");
      await syncDbToS3();
    }

    const orderToken = signPaymentOrderToken(orderId, session.user.id, plan.id, amountInr);

    return NextResponse.json({
      orderId,
      orderToken,
      plan,
      amountInr,
      gstAmountInr,
      baseAmountInr: amountInr - gstAmountInr,
      razorpayOrderId: razorpayOrder?.id || null,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null,
      gateway: razorpayOrder ? "razorpay" : "native",
    });
  } catch {
    return NextResponse.json({ error: "Unable to create payment order." }, { status: 500 });
  }
}

