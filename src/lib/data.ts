import { getDb } from "./db";
import { ensureSeeded } from "./seed";
import { getSessionPayload, sanitizeUser } from "./auth";
import type {
  AboutContent,
  CategoryRecord,
  ContactSettings,
  HeroSlide,
  LaunchingOfferContent,
  ListingRecord,
  RequirementRecord,
  SubcategoryRecord,
  SubscriptionPlanRecord,
  UserRecord,
  UserRole,
  VendorRecord,
} from "./types";

export interface CurrentSessionInfo {
  user: UserRecord;
  vendor: VendorRecord | null;
  activeSubscription: {
    id: number;
    plan_id: number;
    plan_name: string;
    starts_at: string;
    ends_at: string;
    status: string;
  } | null;
}

function toPlain<T>(row: T | undefined): T | undefined {
  return row && typeof row === "object" ? ({ ...row } as T) : row;
}

function toPlainList<T>(rows: unknown[]): T[] {
  return rows.map((r) => ({ ...(r as Record<string, unknown>) }) as T);
}

export async function getCurrentSession(): Promise<CurrentSessionInfo | null> {
  ensureSeeded();
  const payload = await getSessionPayload();
  if (!payload) return null;

  const db = getDb();
  const userRow = db
    .prepare(`SELECT id, name, email, mobile, whatsapp, role, status, created_at FROM users WHERE id = ?`)
    .get(payload.uid) as Record<string, unknown> | undefined;

  if (!userRow || userRow.status === "suspended") return null;

  const user = sanitizeUser(userRow);
  const vendorRow = db
    .prepare(`SELECT * FROM vendors WHERE user_id = ?`)
    .get(user.id) as unknown as VendorRecord | undefined;

  const subRow = db
    .prepare(
      `SELECT us.id, us.plan_id, sp.name as plan_name, us.starts_at, us.ends_at, us.status
       FROM user_subscriptions us
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE us.user_id = ? AND us.status = 'active' AND datetime(us.ends_at) > datetime('now')
       ORDER BY us.id DESC LIMIT 1`
    )
    .get(user.id) as CurrentSessionInfo["activeSubscription"] | undefined;

  return {
    user,
    vendor: toPlain(vendorRow) || null,
    activeSubscription: toPlain(subRow) || null,
  };
}

export async function requireRole(allowedRoles: UserRole[]): Promise<CurrentSessionInfo | null> {
  const session = await getCurrentSession();
  if (!session) return null;
  if (allowedRoles.includes(session.user.role)) return session;
  // If user has a linked vendor record, grant vendor role access
  if (allowedRoles.includes("vendor") && session.vendor) return session;
  return null;
}

export function getCmsMap(): {
  heroSlides: HeroSlide[];
  aboutContent: AboutContent;
  launchingOffer: LaunchingOfferContent;
  contactSettings: ContactSettings;
  businessSupport: Array<{
    id: string;
    title: string;
    subtitle: string;
    description: string;
    badge: string;
    conditions: string;
  }>;
} {
  ensureSeeded();
  const db = getDb();
  const rows = db.prepare(`SELECT key, value FROM site_content`).all() as Array<{ key: string; value: string }>;
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const parse = <T>(key: string, fallback: T): T => {
    const raw = map.get(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  return {
    heroSlides: parse("hero_slides", []),
    aboutContent: parse("about_content", {
      headline: "About Sirrinidhi Enterprises",
      subheadline: "RAWMAT MART",
      summary: "",
      fullStory: "",
      mission: "",
      vision: "",
      imageUrl: "/images/refinery-plant.png",
      stats: [],
    }),
    launchingOffer: parse("launching_offer", {
      badge: "Launching Offer",
      title: "Launching Offer",
      subtitle: "Get Special Discounts for Paid Subscribers!",
      ctaText: "Subscribe Now",
      fourthYearFreeNote: "",
      highlights: [],
    }),
    contactSettings: parse("contact_settings", {
      companyName: "Sirrinidhi Enterprises",
      portalName: "RAWMAT MART",
      mobile: "+91 7382177653",
      whatsapp: "917382177653",
      email: "support@rawmet.com",
      address: "Hyderabad, India",
      gstNumber: "",
      referralRewardRule: "",
      conditionsApplyNote: "Conditions Apply • Check with Customer Care",
    }),
    businessSupport: parse("business_support", []),
  };
}

export function getCategories(type?: "product" | "machinery" | "service"): CategoryRecord[] {
  ensureSeeded();
  const db = getDb();
  if (type) {
    return toPlainList<CategoryRecord>(
      db
        .prepare(`SELECT * FROM categories WHERE type = ? AND is_active = 1 ORDER BY sort_order ASC, id ASC`)
        .all(type)
    );
  }
  return toPlainList<CategoryRecord>(
    db
      .prepare(`SELECT * FROM categories WHERE is_active = 1 ORDER BY type ASC, sort_order ASC, id ASC`)
      .all()
  );
}

export function getSubcategories(categoryId?: number): SubcategoryRecord[] {
  ensureSeeded();
  const db = getDb();
  if (categoryId) {
    return toPlainList<SubcategoryRecord>(
      db.prepare(`SELECT * FROM subcategories WHERE category_id = ? ORDER BY name ASC`).all(categoryId)
    );
  }
  return toPlainList<SubcategoryRecord>(db.prepare(`SELECT * FROM subcategories ORDER BY name ASC`).all());
}

export interface ListingFilters {
  type?: "product" | "machinery" | "service" | "";
  category?: string;
  subcategory?: string;
  q?: string;
  location?: string;
  vendorId?: number;
  status?: "approved" | "pending" | "rejected" | "all";
  featured?: boolean;
  sort?: "newest" | "views" | "title";
  limit?: number;
  offset?: number;
}

export function queryListings(filters: ListingFilters = {}): {
  items: ListingRecord[];
  total: number;
} {
  ensureSeeded();
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  const statusFilter = filters.status || "approved";
  if (statusFilter !== "all") {
    conditions.push(`l.status = ?`);
    params.push(statusFilter);
    conditions.push(`(v.id IS NULL OR v.verification_status = 'approved' OR l.vendor_id = 1)`);
  }

  if (filters.type) {
    conditions.push(`l.type = ?`);
    params.push(filters.type);
  }
  if (filters.category) {
    conditions.push(`l.category_slug = ?`);
    params.push(filters.category);
  }
  if (filters.subcategory) {
    conditions.push(`l.subcategory_slug = ?`);
    params.push(filters.subcategory);
  }
  if (filters.vendorId) {
    conditions.push(`l.vendor_id = ?`);
    params.push(filters.vendorId);
  }
  if (filters.location) {
    conditions.push(`LOWER(l.location) LIKE ?`);
    params.push(`%${filters.location.toLowerCase()}%`);
  }
  if (filters.featured) {
    conditions.push(`l.featured = 1`);
  }
  if (filters.q) {
    const qLike = `%${filters.q.toLowerCase()}%`;
    conditions.push(
      `(LOWER(l.title) LIKE ? OR LOWER(l.short_description) LIKE ? OR LOWER(l.description) LIKE ? OR LOWER(l.category_slug) LIKE ? OR LOWER(v.business_name) LIKE ?)`
    );
    params.push(qLike, qLike, qLike, qLike, qLike);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderBy =
    filters.sort === "views"
      ? "l.views_count DESC, l.id DESC"
      : filters.sort === "title"
        ? "l.title ASC"
        : "l.featured DESC, l.id DESC";

  const limit = Math.min(Math.max(filters.limit || 24, 1), 100);
  const offset = Math.max(filters.offset || 0, 0);

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM listings l LEFT JOIN vendors v ON v.id = l.vendor_id ${whereClause}`)
    .get(...params) as { total: number };

  const items = db
    .prepare(
      `SELECT l.*,
              COALESCE(v.business_name, 'RAWMAT Verified Seller') as vendor_name,
              CASE WHEN v.verification_status = 'approved' OR v.id IS NULL THEN 1 ELSE 0 END as vendor_verified,
              COALESCE(v.whatsapp, '917382177653') as vendor_whatsapp,
              COALESCE(v.mobile, '7382177653') as vendor_mobile,
              COALESCE(v.city, 'Pan India') as vendor_city
       FROM listings l
       LEFT JOIN vendors v ON v.id = l.vendor_id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as unknown as ListingRecord[];

  return {
    items: items.map((item) => ({ ...item, vendor_verified: Boolean(item.vendor_verified) })),
    total: countRow?.total || 0,
  };
}

export function getListingBySlug(slug: string): {
  listing: ListingRecord | null;
  vendor: VendorRecord | null;
  related: ListingRecord[];
  availableSellers?: Array<{
    listing_id: number;
    price_display: string;
    price_numeric: number;
    price_unit: string;
    min_order_qty: string;
    availability: string;
    location: string;
    specifications: string;
    description: string;
    master_product_id: number | null;
    vendor_id: number;
    user_id: number;
    seller_name: string;
    business_name: string;
    mobile: string;
    whatsapp: string;
    email: string;
    gst_number: string;
    vendor_city: string;
    vendor_state: string;
    verification_status: string;
    is_current: number;
  }>;
} {
  ensureSeeded();
  const db = getDb();
  const decoded = decodeURIComponent(slug || "").toLowerCase().trim();
  let row = db
    .prepare(
      `SELECT l.*,
              COALESCE(v.business_name, 'RAWMAT Verified Seller') as vendor_name,
              CASE WHEN v.verification_status = 'approved' OR v.id IS NULL THEN 1 ELSE 0 END as vendor_verified,
              COALESCE(v.whatsapp, '917382177653') as vendor_whatsapp,
              COALESCE(v.mobile, '7382177653') as vendor_mobile,
              COALESCE(v.city, 'Pan India') as vendor_city
       FROM listings l
       LEFT JOIN vendors v ON v.id = l.vendor_id
       WHERE LOWER(l.slug) = ?`
    )
    .get(decoded) as unknown as ListingRecord | undefined;

  if (!row) {
    row = db
      .prepare(
        `SELECT l.*,
                COALESCE(v.business_name, 'RAWMAT Verified Seller') as vendor_name,
                CASE WHEN v.verification_status = 'approved' OR v.id IS NULL THEN 1 ELSE 0 END as vendor_verified,
                COALESCE(v.whatsapp, '917382177653') as vendor_whatsapp,
                COALESCE(v.mobile, '7382177653') as vendor_mobile,
                COALESCE(v.city, 'Pan India') as vendor_city
         FROM listings l
         LEFT JOIN vendors v ON v.id = l.vendor_id
         WHERE l.slug LIKE ? OR LOWER(l.title) = ? OR CAST(l.id AS TEXT) = ?
         ORDER BY l.id DESC LIMIT 1`
      )
      .get(`${decoded}%`, decoded, decoded) as unknown as ListingRecord | undefined;
  }

  if (!row) return { listing: null, vendor: null, related: [] };

  db.prepare(`UPDATE listings SET views_count = views_count + 1 WHERE id = ?`).run(row.id);

  let vendor = row.vendor_id
    ? (db.prepare(`SELECT * FROM vendors WHERE id = ?`).get(row.vendor_id) as unknown as VendorRecord | undefined)
    : undefined;
  if (!vendor) {
    vendor = {
      id: 1,
      user_id: 1,
      business_name: "RAWMAT MART Verified Seller",
      owner_name: "Platform Seller",
      mobile: "7382177653",
      whatsapp: "917382177653",
      email: "support@rawmet.com",
      business_category: "Industrial Supplier",
      product_service_category: "Pan India Verified",
      gst_number: "VERIFIED-GST",
      id_proof_type: "GST Certificate",
      id_proof_url: "",
      logo_url: "/images/rawmet-logo.png",
      address: "Hyderabad, India",
      city: "Pan India",
      state: "India",
      description: "Direct listing verified by RAWMAT MART Super Admin.",
      product_details: "",
      verification_status: "approved",
      whatsapp_opt_in: 1,
      whatsapp_categories: "[]",
      created_at: new Date().toISOString(),
    };
  }

  const related = db
    .prepare(
      `SELECT l.*,
              COALESCE(v.business_name, 'RAWMAT Verified Seller') as vendor_name,
              CASE WHEN v.verification_status = 'approved' OR v.id IS NULL THEN 1 ELSE 0 END as vendor_verified
       FROM listings l
       LEFT JOIN vendors v ON v.id = l.vendor_id
       WHERE l.status = 'approved'
         AND l.id != ? AND (l.category_slug = ? OR l.type = ?)
       ORDER BY CASE WHEN l.category_slug = ? THEN 0 ELSE 1 END, l.id DESC
       LIMIT 4`
    )
    .all(row.id, row.category_slug, row.type, row.category_slug) as unknown as ListingRecord[];

  const masterId = row.master_product_id || row.id;
  const availableSellers = db
    .prepare(
      `SELECT l.id as listing_id, l.price_display, l.price_numeric, l.price_unit,
              l.min_order_qty, l.availability, l.location, l.specifications, l.description,
              l.master_product_id,
              v.id as vendor_id, v.user_id, v.owner_name as seller_name, v.business_name,
              v.mobile, v.whatsapp, v.email, v.gst_number, v.city as vendor_city,
              v.state as vendor_state, v.verification_status,
              CASE WHEN l.id = ? THEN 1 ELSE 0 END as is_current
       FROM listings l
       JOIN vendors v ON v.id = l.vendor_id
       WHERE (l.master_product_id = ? OR l.id = ?)
         AND (l.status = 'approved' OR l.status IS NULL)
         AND (l.is_published = 1 OR l.is_published IS NULL)
         AND (v.verification_status = 'approved' OR v.verification_status IS NULL)
       ORDER BY l.price_numeric ASC, l.id ASC`
    )
    .all(row.id, masterId, masterId) as unknown as Array<{
      listing_id: number;
      price_display: string;
      price_numeric: number;
      price_unit: string;
      min_order_qty: string;
      availability: string;
      location: string;
      specifications: string;
      description: string;
      master_product_id: number | null;
      vendor_id: number;
      user_id: number;
      seller_name: string;
      business_name: string;
      mobile: string;
      whatsapp: string;
      email: string;
      gst_number: string;
      vendor_city: string;
      vendor_state: string;
      verification_status: string;
      is_current: number;
    }>;

  return {
    listing: { ...row, vendor_verified: Boolean(row.vendor_verified) },
    vendor: toPlain(vendor) || null,
    related: related.map((r) => ({ ...r, vendor_verified: Boolean(r.vendor_verified) })),
    availableSellers,
  };
}

export function getSubscriptionPlans(includeInactive = false): SubscriptionPlanRecord[] {
  ensureSeeded();
  const db = getDb();
  const where = includeInactive ? "" : "WHERE is_active = 1";
  return toPlainList<SubscriptionPlanRecord>(
    db.prepare(`SELECT * FROM subscription_plans ${where} ORDER BY sort_order ASC, id ASC`).all()
  );
}

export function getGalleryItems(category?: string): Array<{
  id: number;
  title: string;
  category: string;
  image_url: string;
  caption: string;
  sort_order: number;
  created_at: string;
}> {
  ensureSeeded();
  const db = getDb();
  if (category && category !== "All") {
    return toPlainList(
      db.prepare(`SELECT * FROM gallery_items WHERE category = ? ORDER BY sort_order ASC, id DESC`).all(category)
    );
  }
  return toPlainList(db.prepare(`SELECT * FROM gallery_items ORDER BY sort_order ASC, id DESC`).all());
}

export function getRequirements(filters: { category?: string; q?: string; limit?: number } = {}): RequirementRecord[] {
  ensureSeeded();
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.category && filters.category !== "all") {
    conditions.push(`category_slug = ?`);
    params.push(filters.category);
  }
  if (filters.q) {
    const qLike = `%${filters.q.toLowerCase()}%`;
    conditions.push(`(LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(location) LIKE ?)`);
    params.push(qLike, qLike, qLike);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Math.min(filters.limit || 50, 100);
  return toPlainList<RequirementRecord>(
    db.prepare(`SELECT * FROM requirements ${whereClause} ORDER BY id DESC LIMIT ?`).all(...params, limit)
  );
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `item-${Date.now()}`;
}

