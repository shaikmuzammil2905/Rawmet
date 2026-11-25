import { NextResponse } from "next/server";
import { getDb, syncDbToS3 } from "@/lib/db";
import { requireRole } from "@/lib/data";

/**
 * Append-only Audit Log endpoint for authorized Admins.
 * No PUT/PATCH/DELETE methods are exposed so audit history cannot be altered or deleted.
 */
export async function POST(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      action?: string;
      entityType?: string;
      entityId?: number;
      targetUserId?: number;
      previousStatus?: string;
      newStatus?: string;
      details?: string;
    };

    const action = (body.action || "").trim();
    if (!action) {
      return NextResponse.json({ error: "Audit action is required." }, { status: 400 });
    }

    const db = getDb();
    db.prepare(
      `INSERT INTO audit_logs (
         user_id, user_email, action, entity_type, entity_id,
         target_user_id, admin_id, previous_status, new_status, details
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      session.user.id,
      session.user.email,
      action,
      body.entityType || "vendor",
      body.entityId ?? null,
      body.targetUserId ?? null,
      session.user.id,
      body.previousStatus || "",
      body.newStatus || "",
      body.details || ""
    );

    await syncDbToS3();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Audit log error:", err);
    return NextResponse.json({ error: "Failed to record audit event." }, { status: 500 });
  }
}
