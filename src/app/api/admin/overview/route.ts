import { NextResponse } from "next/server";
import { getDb, syncDbFromS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { getCmsMap, getSubscriptionPlans, requireRole } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await syncDbFromS3(true);
    ensureSeeded();
    const session = await requireRole(["admin"]);
    if (!session) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const db = getDb();

  // Basic counts
  const totalUsers = (db.prepare(`SELECT COUNT(*) as c FROM users WHERE role != 'admin'`).get() as { c: number }).c;
  const totalVendors = (db.prepare(`SELECT COUNT(*) as c FROM vendors`).get() as { c: number }).c;
  const totalRegisteredSellers = totalVendors;
  const totalRegisteredBuyers = (db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'customer'`).get() as { c: number }).c;
  const activeVendors = (
    db.prepare(`SELECT COUNT(*) as c FROM vendors WHERE verification_status = 'approved'`).get() as { c: number }
  ).c;
  const pendingVendors = (
    db.prepare(`SELECT COUNT(*) as c FROM vendors WHERE verification_status = 'pending'`).get() as { c: number }
  ).c;
  const rejectedVendors = (
    db.prepare(`SELECT COUNT(*) as c FROM vendors WHERE verification_status = 'rejected'`).get() as { c: number }
  ).c;

  const activeBuyers = (
    db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'customer' AND status = 'active'`).get() as { c: number }
  ).c;

  // Listings by type and status
  const totalListings = (db.prepare(`SELECT COUNT(*) as c FROM listings`).get() as { c: number }).c;
  const approvedListings = (
    db.prepare(`SELECT COUNT(*) as c FROM listings WHERE status = 'approved'`).get() as { c: number }
  ).c;
  const pendingListings = (
    db.prepare(`SELECT COUNT(*) as c FROM listings WHERE status = 'pending'`).get() as { c: number }
  ).c;
  const rejectedListings = (
    db.prepare(`SELECT COUNT(*) as c FROM listings WHERE status = 'rejected'`).get() as { c: number }
  ).c;

  const totalProducts = (db.prepare(`SELECT COUNT(*) as c FROM listings WHERE type = 'product'`).get() as { c: number }).c;
  const approvedProducts = (
    db.prepare(`SELECT COUNT(*) as c FROM listings WHERE type = 'product' AND status = 'approved'`).get() as { c: number }
  ).c;
  const pendingProducts = (
    db.prepare(`SELECT COUNT(*) as c FROM listings WHERE type = 'product' AND status = 'pending'`).get() as { c: number }
  ).c;
  const rejectedProducts = (
    db.prepare(`SELECT COUNT(*) as c FROM listings WHERE type = 'product' AND status = 'rejected'`).get() as { c: number }
  ).c;

  const totalMachineryListings = (
    db.prepare(`SELECT COUNT(*) as c FROM listings WHERE type = 'machinery'`).get() as { c: number }
  ).c;
  const totalServiceListings = (
    db.prepare(`SELECT COUNT(*) as c FROM listings WHERE type = 'service'`).get() as { c: number }
  ).c;

  const totalRequirements = (db.prepare(`SELECT COUNT(*) as c FROM requirements`).get() as { c: number }).c;

  // Subscriptions & Payments
  const activeSubscriptions = (
    db
      .prepare(`SELECT COUNT(*) as c FROM user_subscriptions WHERE status = 'active' AND datetime(ends_at) > datetime('now')`)
      .get() as { c: number }
  ).c;
  const expiredSubscriptions = (
    db
      .prepare(`SELECT COUNT(*) as c FROM user_subscriptions WHERE datetime(ends_at) <= datetime('now')`)
      .get() as { c: number }
  ).c;

  const totalRevenueInr = (
    db.prepare(`SELECT COALESCE(SUM(amount_inr), 0) as s FROM payments WHERE status = 'paid'`).get() as { s: number }
  ).s;
  const totalVerifiedPayments = (
    db.prepare(`SELECT COUNT(*) as c FROM payments WHERE status = 'paid'`).get() as { c: number }
  ).c;
  const pendingPayments = (
    db.prepare(`SELECT COUNT(*) as c FROM payments WHERE status = 'pending'`).get() as { c: number }
  ).c;

  const pendingFormsCount = (
    db.prepare(`SELECT COUNT(*) as c FROM subscription_forms WHERE status = 'pending'`).get() as { c: number }
  ).c;

  const kpi = {
    totalUsers,
    totalRegisteredSellers,
    totalRegisteredBuyers,
    activeSellers: activeVendors,
    activeBuyers,
    totalVendors,
    activeVendors,
    pendingVendors,
    rejectedVendors,
    totalListings,
    approvedListings,
    pendingListings,
    rejectedListings,
    totalProducts,
    approvedProducts,
    pendingProducts,
    rejectedProducts,
    totalMachineryListings,
    totalServiceListings,
    totalRequirements,
    activeSubscriptions,
    expiredSubscriptions,
    totalRevenueInr,
    totalVerifiedPayments,
    pendingPayments,
    pendingFormsCount,
  };

  const categoryBreakdown = db
    .prepare(
      `SELECT type, COUNT(*) as count
       FROM listings
       GROUP BY type`
    )
    .all();

  const vendors = db
    .prepare(
      `SELECT v.*, u.name as user_name, u.email as user_email, u.mobile as user_mobile
       FROM vendors v
       LEFT JOIN users u ON u.id = v.user_id
       ORDER BY v.id DESC`
    )
    .all();
  const users = db
    .prepare(`SELECT id, name, email, mobile, whatsapp, role, status, created_at FROM users ORDER BY id DESC`)
    .all();
  const listings = db
    .prepare(
      `SELECT l.*,
              COALESCE(v.business_name, 'Platform / Admin Master') as vendor_name,
              m.title as master_title
       FROM listings l
       LEFT JOIN vendors v ON v.id = l.vendor_id
       LEFT JOIN listings m ON m.id = l.master_product_id
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
  const subscriptionForms = db.prepare(`SELECT * FROM subscription_forms ORDER BY id DESC`).all();
  const auditLogs = db.prepare(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 150`).all();
  const plans = getSubscriptionPlans(true);
  const cms = getCmsMap();

    return NextResponse.json(
      {
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
        subscriptionForms,
        auditLogs,
        plans,
        cms,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err) {
    console.error("Admin overview error:", err);
    return NextResponse.json({ error: "Failed to generate admin overview." }, { status: 500 });
  }
}
