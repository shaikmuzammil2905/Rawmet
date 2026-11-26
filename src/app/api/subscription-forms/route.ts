import { NextResponse } from "next/server";
import { getDb, syncDbFromS3, syncDbToS3 } from "@/lib/db";
import { requireRole } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await syncDbFromS3(true);
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const db = getDb();
  let query = `SELECT * FROM subscription_forms`;
  const params: unknown[] = [];

  if (status && status !== "all") {
    query += ` WHERE status = ?`;
    params.push(status);
  }

  query += ` ORDER BY id DESC`;

  const forms = db.prepare(query).all(...params);
  return NextResponse.json({ forms });
}

export async function POST(req: Request) {
  try {
    await syncDbFromS3(true);
    const body = (await req.json()) as {
      user_id?: number;
      user_type?: "seller" | "buyer";
      name: string;
      business_name?: string;
      mobile: string;
      email?: string;
      plan_name?: string;
      amount_inr?: number;
      notes?: string;
    };

    const name = (body.name || "").trim();
    const mobile = (body.mobile || "").trim();
    if (!name || !mobile) {
      return NextResponse.json({ error: "Name and Mobile number are required." }, { status: 400 });
    }

    const db = getDb();
    const res = db
      .prepare(
        `INSERT INTO subscription_forms (
          user_id, user_type, name, business_name, mobile, email,
          plan_name, amount_inr, notes, status, admin_remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '')`
      )
      .run(
        body.user_id || null,
        body.user_type || "seller",
        name,
        (body.business_name || "").trim(),
        mobile,
        (body.email || "").trim(),
        body.plan_name || "Subscription Form (₹1,500)",
        body.amount_inr ?? 1500,
        (body.notes || "").trim()
      );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_email, action, details)
      VALUES (?, ?, 'subscription_form_submitted', ?)
    `).run(
      body.user_id || null,
      body.email || mobile,
      `New form submitted by ${name} (${mobile}) for ${body.plan_name || "₹1,500 Plan"}`
    );

    await syncDbToS3();
    return NextResponse.json({
      success: true,
      id: Number(res.lastInsertRowid),
      message: "Subscription form submitted successfully. Our team will verify and activate your benefits.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to submit subscription form.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    await syncDbFromS3(true);
    const body = (await req.json()) as {
      id: number;
      status?: "pending" | "approved" | "rejected" | "converted";
      admin_remarks?: string;
      convertToUserId?: number;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Form ID is required." }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare(`SELECT * FROM subscription_forms WHERE id = ?`).get(body.id) as
      | {
          id: number;
          user_id: number | null;
          name: string;
          mobile: string;
          email: string;
          plan_name: string;
          amount_inr: number;
        }
      | undefined;

    if (!existing) {
      return NextResponse.json({ error: "Subscription form not found." }, { status: 404 });
    }

    db.prepare(
      `UPDATE subscription_forms
       SET status = COALESCE(?, status),
           admin_remarks = COALESCE(?, admin_remarks),
           updated_at = datetime('now')
       WHERE id = ?`
    ).run(body.status ?? null, body.admin_remarks ?? null, body.id);

    // If converting to active subscription
    if (body.status === "converted") {
      const targetUserId = body.convertToUserId || existing.user_id;
      if (targetUserId) {
        // Find corresponding plan or fallback to 12 months plan
        const plan = db.prepare(`SELECT id, duration_months FROM subscription_plans WHERE slug = 'subscription-form-plan' OR price_inr = ? LIMIT 1`).get(existing.amount_inr) as { id: number; duration_months: number } | undefined;
        const planId = plan?.id || 1;
        const durationMonths = plan?.duration_months || 12;

        db.prepare(
          `INSERT INTO user_subscriptions (user_id, plan_id, status, starts_at, ends_at)
           VALUES (?, ?, 'active', datetime('now'), datetime('now', '+${durationMonths} months'))`
        ).run(targetUserId, planId);
      }
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_email, action, details)
      VALUES (?, ?, 'subscription_form_status_update', ?)
    `).run(
      session.user.id,
      session.user.email,
      `Form #${body.id} status changed to ${body.status || "updated"} by Admin`
    );

    await syncDbToS3();
    return NextResponse.json({ success: true, message: "Subscription form updated successfully." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update subscription form.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
