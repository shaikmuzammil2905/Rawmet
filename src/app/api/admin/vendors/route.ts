import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/data";

export async function PATCH(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = (await req.json()) as {
    vendorId?: number;
    verificationStatus?: "pending" | "approved" | "rejected" | "suspended";
    rejectionReason?: string;
  };

  if (!body.vendorId || !body.verificationStatus) {
    return NextResponse.json({ error: "vendorId and verificationStatus are required." }, { status: 400 });
  }

  const db = getDb();
  db.prepare(
    `UPDATE vendors
     SET verification_status = ?,
         rejection_reason = COALESCE(?, rejection_reason)
     WHERE id = ?`
  ).run(
    body.verificationStatus,
    body.verificationStatus === "rejected" ? (body.rejectionReason || "Documents require revision.") : null,
    body.vendorId
  );

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_email, action, details)
    VALUES (?, ?, 'vendor_status_update', ?)
  `).run(
    session.user.id,
    session.user.email,
    `Vendor #${body.vendorId} status set to ${body.verificationStatus}${body.rejectionReason ? ` (Reason: ${body.rejectionReason})` : ""}`
  );

  return NextResponse.json({ success: true });
}
