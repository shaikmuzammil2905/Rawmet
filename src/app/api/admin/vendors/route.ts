import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/data";

export async function PATCH(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = (await req.json()) as {
    vendorId?: number;
    verificationStatus?: "pending" | "approved" | "rejected" | "suspended";
  };

  if (!body.vendorId || !body.verificationStatus) {
    return NextResponse.json({ error: "vendorId and verificationStatus are required." }, { status: 400 });
  }

  const db = getDb();
  db.prepare(`UPDATE vendors SET verification_status = ? WHERE id = ?`).run(
    body.verificationStatus,
    body.vendorId
  );
  return NextResponse.json({ success: true });
}

