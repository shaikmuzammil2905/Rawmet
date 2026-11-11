import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentSession } from "@/lib/data";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const db = getDb();
  const items = db
    .prepare(
      `SELECT l.*, v.business_name as vendor_name
       FROM saved_listings sl
       JOIN listings l ON l.id = sl.listing_id
       JOIN vendors v ON v.id = l.vendor_id
       WHERE sl.user_id = ?
       ORDER BY sl.id DESC`
    )
    .all(session.user.id);

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Please login to save listings." }, { status: 401 });

  const { listingId } = (await req.json()) as { listingId?: number };
  if (!listingId) return NextResponse.json({ error: "Listing ID required." }, { status: 400 });

  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO saved_listings (user_id, listing_id) VALUES (?, ?)`).run(
    session.user.id,
    listingId
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const listingId = Number(searchParams.get("listingId"));
  const db = getDb();
  db.prepare(`DELETE FROM saved_listings WHERE user_id = ? AND listing_id = ?`).run(
    session.user.id,
    listingId
  );
  return NextResponse.json({ success: true });
}

