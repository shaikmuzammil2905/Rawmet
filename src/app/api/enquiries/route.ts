import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb, syncDbFromS3, syncDbToS3 } from "@/lib/db";
import { getCurrentSession } from "@/lib/data";

export async function POST(req: Request) {
  try {
    await syncDbFromS3(true);
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

    await syncDbToS3();
    revalidatePath("/", "layout");

    return NextResponse.json(
      { success: true, message: "Your enquiry has been sent to the verified vendor & RAWMAT MART desk." },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Enquiry POST error:", err);
    const msg = err instanceof Error ? err.message : "Failed to send enquiry.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

