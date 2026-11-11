import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentSession } from "@/lib/data";
import { verifyPaymentOrderToken } from "@/lib/auth";
import type { SubscriptionPlanRecord } from "@/lib/types";

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      orderId?: string;
      orderToken?: string;
      outcome?: "paid" | "failed" | "pending" | "cancelled";
      paymentMethod?: string;
      failureReason?: string;
    };

    const orderId = (body.orderId || "").trim();
    const orderToken = (body.orderToken || "").trim();
    const outcome = body.outcome || "paid";

    if (!orderId || !orderToken) {
      return NextResponse.json({ error: "Missing order verification details." }, { status: 400 });
    }

    const db = getDb();
    const payment = db
      .prepare(`SELECT * FROM payments WHERE order_id = ? AND user_id = ?`)
      .get(orderId, session.user.id) as
      | {
          id: number;
          order_id: string;
          user_id: number;
          plan_id: number;
          amount_inr: number;
          gst_amount_inr: number;
          status: string;
          invoice_number: string;
        }
      | undefined;

    if (!payment) {
      return NextResponse.json({ error: "Payment order not found." }, { status: 404 });
    }

    // Duplicate payment protection
    if (payment.status === "paid") {
      return NextResponse.json({
        success: true,
        duplicateProtected: true,
        status: "paid",
        invoiceNumber: payment.invoice_number,
        message: "Payment already verified and subscription activated.",
      });
    }

    // Verify server-issued HMAC signature
    if (!verifyPaymentOrderToken(orderToken, payment.order_id, session.user.id, payment.plan_id, payment.amount_inr)) {
      return NextResponse.json({ error: "Invalid payment verification signature." }, { status: 403 });
    }

    if (outcome === "failed" || outcome === "cancelled" || outcome === "pending") {
      const reason =
        body.failureReason ||
        (outcome === "cancelled"
          ? "Cancelled by user during checkout"
          : outcome === "pending"
            ? "Awaiting bank / UPI confirmation"
            : "Payment declined by issuing bank");

      db.prepare(
        `UPDATE payments SET status = ?, failure_reason = ?, payment_method = COALESCE(?, payment_method) WHERE id = ?`
      ).run(outcome, reason, body.paymentMethod ?? null, payment.id);

      return NextResponse.json(
        {
          success: false,
          status: outcome,
          message: reason,
        },
        { status: outcome === "pending" ? 202 : 402 }
      );
    }

    const plan = db
      .prepare(`SELECT * FROM subscription_plans WHERE id = ?`)
      .get(payment.plan_id) as unknown as SubscriptionPlanRecord;

    const paymentGatewayId = `PAY_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
    const invoiceNumber = `INV-RAW-${new Date().getFullYear()}-${String(payment.id).padStart(4, "0")}`;
    const totalMonths = plan.duration_months + plan.bonus_months;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + totalMonths);

    db.exec("BEGIN TRANSACTION");
    try {
      db.prepare(
        `UPDATE payments
         SET status = 'paid', payment_id = ?, signature = ?, invoice_number = ?,
             payment_method = COALESCE(?, payment_method), verified_at = datetime('now')
         WHERE id = ?`
      ).run(paymentGatewayId, orderToken, invoiceNumber, body.paymentMethod ?? null, payment.id);

      // Expire prior active subscriptions cleanly before activating new period
      db.prepare(`UPDATE user_subscriptions SET status = 'expired' WHERE user_id = ? AND status = 'active'`).run(
        session.user.id
      );

      db.prepare(
        `INSERT INTO user_subscriptions (user_id, plan_id, payment_id, status, starts_at, ends_at)
         VALUES (?, ?, ?, 'active', ?, ?)`
      ).run(session.user.id, plan.id, payment.id, startDate.toISOString(), endDate.toISOString());

      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }

    return NextResponse.json({
      success: true,
      status: "paid",
      paymentId: paymentGatewayId,
      invoiceNumber,
      startsAt: startDate.toISOString(),
      endsAt: endDate.toISOString(),
      planName: plan.name,
      message: `Subscription activated! GST Invoice ${invoiceNumber} generated.`,
    });
  } catch {
    return NextResponse.json({ error: "Payment verification error." }, { status: 500 });
  }
}

