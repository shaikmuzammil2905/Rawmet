import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentSession } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    const body = (await req.json()) as {
      listingId?: number;
      vendorId?: number;
      name?: string;
      businessName?: string;
      mobile?: string;
      email?: string;
      message?: string;
    };

    const name = (body.name || "").trim();
    const mobile = (body.mobile || "").replace(/\D/g, "").slice(-10);
    const message = (body.message || "").trim();

    if (!name || mobile.length !== 10 || !message) {
      return NextResponse.json(
        { error: "Name, 10-digit mobile number, and enquiry message are required." },
        { status: 400 }
      );
    }

    const db = getDb();
    let vendorId = body.vendorId || null;
    if (!vendorId && body.listingId) {
      const l = db.prepare(`SELECT vendor_id FROM listings WHERE id = ?`).get(body.listingId) as
        | { vendor_id: number }
        | undefined;
      vendorId = l?.vendor_id ?? null;
    }

    db.prepare(
      `INSERT INTO enquiries (listing_id, vendor_id, user_id, name, business_name, mobile, email, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')`
    ).run(
      body.listingId ?? null,
      vendorId,
      session?.user.id ?? null,
      name,
      body.businessName || "",
      mobile,
      body.email || "",
      message
    );

    return NextResponse.json(
      { success: true, message: "Your enquiry has been sent to the verified vendor & RAWMET desk." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to send enquiry." }, { status: 500 });
  }
}

