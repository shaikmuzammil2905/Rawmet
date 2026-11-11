import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/data";

export async function GET() {
  const session = await requireRole(["vendor"]);
  if (!session || !session.vendor) {
    return NextResponse.json({ error: "Vendor authentication required." }, { status: 401 });
  }

  const db = getDb();
  const enquiries = db
    .prepare(
      `SELECT e.*, l.title as listing_title
       FROM enquiries e
       LEFT JOIN listings l ON l.id = e.listing_id
       WHERE e.vendor_id = ?
       ORDER BY e.id DESC LIMIT 50`
    )
    .all(session.vendor.id);

  const notifications = db
    .prepare(
      `SELECT wn.*, r.title as requirement_title, r.quantity, r.location, r.mobile as buyer_mobile, r.whatsapp as buyer_whatsapp
       FROM whatsapp_notifications wn
       LEFT JOIN requirements r ON r.id = wn.requirement_id
       WHERE wn.vendor_id = ?
       ORDER BY wn.id DESC LIMIT 50`
    )
    .all(session.vendor.id);

  const requirements = db
    .prepare(`SELECT * FROM requirements ORDER BY id DESC LIMIT 30`)
    .all();

  return NextResponse.json({
    vendor: session.vendor,
    enquiries,
    notifications,
    requirements,
  });
}

export async function PATCH(req: Request) {
  const session = await requireRole(["vendor"]);
  if (!session || !session.vendor) {
    return NextResponse.json({ error: "Vendor authentication required." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      whatsapp?: string;
      city?: string;
      state?: string;
      address?: string;
      description?: string;
      whatsapp_opt_in?: boolean;
      whatsapp_categories?: string[];
    };

    const db = getDb();
    db.prepare(
      `UPDATE vendors SET
        whatsapp = COALESCE(?, whatsapp),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        address = COALESCE(?, address),
        description = COALESCE(?, description),
        whatsapp_opt_in = COALESCE(?, whatsapp_opt_in),
        whatsapp_categories = COALESCE(?, whatsapp_categories)
      WHERE id = ?`
    ).run(
      body.whatsapp ?? null,
      body.city ?? null,
      body.state ?? null,
      body.address ?? null,
      body.description ?? null,
      typeof body.whatsapp_opt_in === "boolean" ? (body.whatsapp_opt_in ? 1 : 0) : null,
      body.whatsapp_categories ? JSON.stringify(body.whatsapp_categories) : null,
      session.vendor.id
    );

    return NextResponse.json({ success: true, message: "Vendor profile & WhatsApp notification controls updated." });
  } catch {
    return NextResponse.json({ error: "Failed to update vendor profile." }, { status: 500 });
  }
}

