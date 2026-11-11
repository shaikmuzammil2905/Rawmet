import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentSession } from "@/lib/data";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const db = getDb();
  const savedListings = db
    .prepare(
      `SELECT l.*, v.business_name as vendor_name
       FROM saved_listings sl
       JOIN listings l ON l.id = sl.listing_id
       JOIN vendors v ON v.id = l.vendor_id
       WHERE sl.user_id = ?
       ORDER BY sl.id DESC`
    )
    .all(session.user.id);

  const requirements = db
    .prepare(`SELECT * FROM requirements WHERE user_id = ? OR mobile = ? ORDER BY id DESC LIMIT 30`)
    .all(session.user.id, session.user.mobile);

  const enquiries = db
    .prepare(
      `SELECT e.*, l.title as listing_title, v.business_name as vendor_name
       FROM enquiries e
       LEFT JOIN listings l ON l.id = e.listing_id
       LEFT JOIN vendors v ON v.id = e.vendor_id
       WHERE e.user_id = ? OR e.mobile = ?
       ORDER BY e.id DESC LIMIT 30`
    )
    .all(session.user.id, session.user.mobile);

  const payments = db
    .prepare(
      `SELECT p.*, sp.name as plan_name, sp.duration_months, sp.bonus_months
       FROM payments p
       JOIN subscription_plans sp ON sp.id = p.plan_id
       WHERE p.user_id = ?
       ORDER BY p.id DESC`
    )
    .all(session.user.id);

  const subscriptions = db
    .prepare(
      `SELECT us.*, sp.name as plan_name, sp.duration_months, sp.bonus_months
       FROM user_subscriptions us
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE us.user_id = ?
       ORDER BY us.id DESC`
    )
    .all(session.user.id);

  return NextResponse.json({
    user: session.user,
    activeSubscription: session.activeSubscription,
    savedListings,
    requirements,
    enquiries,
    payments,
    subscriptions,
  });
}

