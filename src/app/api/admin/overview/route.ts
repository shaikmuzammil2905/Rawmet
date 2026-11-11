import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCmsMap, getSubscriptionPlans, requireRole } from "@/lib/data";

export async function GET() {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const db = getDb();

  const kpi = {
    totalUsers: (db.prepare(`SELECT COUNT(*) as c FROM users WHERE role != 'admin'`).get() as { c: number }).c,
    totalVendors: (db.prepare(`SELECT COUNT(*) as c FROM vendors`).get() as { c: number }).c,
    activeVendors: (
      db.prepare(`SELECT COUNT(*) as c FROM vendors WHERE verification_status = 'approved'`).get() as { c: number }
    ).c,
    pendingVendors: (
      db.prepare(`SELECT COUNT(*) as c FROM vendors WHERE verification_status = 'pending'`).get() as { c: number }
    ).c,
    totalListings: (db.prepare(`SELECT COUNT(*) as c FROM listings`).get() as { c: number }).c,
    pendingListings: (
      db.prepare(`SELECT COUNT(*) as c FROM listings WHERE status = 'pending'`).get() as { c: number }
    ).c,
    totalRequirements: (db.prepare(`SELECT COUNT(*) as c FROM requirements`).get() as { c: number }).c,
    activeSubscriptions: (
      db
        .prepare(`SELECT COUNT(*) as c FROM user_subscriptions WHERE status = 'active' AND datetime(ends_at) > datetime('now')`)
        .get() as { c: number }
    ).c,
    totalRevenueInr: (
      db.prepare(`SELECT COALESCE(SUM(amount_inr), 0) as s FROM payments WHERE status = 'paid'`).get() as { s: number }
    ).s,
  };

  const categoryBreakdown = db
    .prepare(
      `SELECT type, COUNT(*) as count
       FROM listings
       GROUP BY type`
    )
    .all();

  const vendors = db.prepare(`SELECT * FROM vendors ORDER BY id DESC`).all();
  const users = db
    .prepare(`SELECT id, name, email, mobile, whatsapp, role, status, created_at FROM users ORDER BY id DESC`)
    .all();
  const listings = db
    .prepare(
      `SELECT l.*, v.business_name as vendor_name
       FROM listings l
       LEFT JOIN vendors v ON v.id = l.vendor_id
       ORDER BY l.id DESC`
    )
    .all();
  const categories = db.prepare(`SELECT * FROM categories ORDER BY type ASC, sort_order ASC, id ASC`).all();
  const subcategories = db
    .prepare(
      `SELECT s.*, c.name as category_name, c.type as category_type
       FROM subcategories s
       JOIN categories c ON c.id = s.category_id
       ORDER BY c.type ASC, s.name ASC`
    )
    .all();
  const requirements = db.prepare(`SELECT * FROM requirements ORDER BY id DESC`).all();
  const enquiries = db
    .prepare(
      `SELECT e.*, l.title as listing_title, v.business_name as vendor_name
       FROM enquiries e
       LEFT JOIN listings l ON l.id = e.listing_id
       LEFT JOIN vendors v ON v.id = e.vendor_id
       ORDER BY e.id DESC`
    )
    .all();
  const subscriptions = db
    .prepare(
      `SELECT us.*, u.name as user_name, u.mobile as user_mobile, sp.name as plan_name, sp.price_inr
       FROM user_subscriptions us
       JOIN users u ON u.id = us.user_id
       JOIN subscription_plans sp ON sp.id = us.plan_id
       ORDER BY us.id DESC`
    )
    .all();
  const payments = db
    .prepare(
      `SELECT p.*, u.name as user_name, u.email as user_email, sp.name as plan_name
       FROM payments p
       JOIN users u ON u.id = p.user_id
       JOIN subscription_plans sp ON sp.id = p.plan_id
       ORDER BY p.id DESC`
    )
    .all();
  const gallery = db.prepare(`SELECT * FROM gallery_items ORDER BY sort_order ASC, id DESC`).all();
  const whatsappNotifications = db
    .prepare(`SELECT * FROM whatsapp_notifications ORDER BY id DESC LIMIT 100`)
    .all();
  const referrals = db.prepare(`SELECT * FROM referrals ORDER BY id DESC`).all();
  const plans = getSubscriptionPlans(true);
  const cms = getCmsMap();

  return NextResponse.json({
    kpi,
    categoryBreakdown,
    vendors,
    users,
    listings,
    categories,
    subcategories,
    requirements,
    enquiries,
    subscriptions,
    payments,
    gallery,
    whatsappNotifications,
    referrals,
    plans,
    cms,
  });
}

