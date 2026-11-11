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
  if (!allowedRoles.includes(session.user.role)) return null;
  return session;
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
      headline: "About Sriñidhi Enterprises",
      subheadline: "RAWMET.com",
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
      companyName: "Sriñidhi Enterprises",
      portalName: "RAWMET.com",
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
    conditions.push(`v.verification_status = 'approved'`);
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
    .prepare(`SELECT COUNT(*) as total FROM listings l JOIN vendors v ON v.id = l.vendor_id ${whereClause}`)
    .get(...params) as { total: number };

  const items = db
    .prepare(
      `SELECT l.*, v.business_name as vendor_name,
              CASE WHEN v.verification_status = 'approved' THEN 1 ELSE 0 END as vendor_verified,
              v.whatsapp as vendor_whatsapp, v.mobile as vendor_mobile, v.city as vendor_city
       FROM listings l
       JOIN vendors v ON v.id = l.vendor_id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as unknown as ListingRecord[];

  return {
    items: items.map((item) => ({ ...item, vendor_verified: Boolean(item.vendor_verified) })),
    total: countRow.total,
  };
}

export function getListingBySlug(slug: string): {
  listing: ListingRecord | null;
  vendor: VendorRecord | null;
  related: ListingRecord[];
} {
  ensureSeeded();
  const db = getDb();
  const row = db
    .prepare(
      `SELECT l.*, v.business_name as vendor_name,
              CASE WHEN v.verification_status = 'approved' THEN 1 ELSE 0 END as vendor_verified,
              v.whatsapp as vendor_whatsapp, v.mobile as vendor_mobile, v.city as vendor_city
       FROM listings l
       JOIN vendors v ON v.id = l.vendor_id
       WHERE l.slug = ?`
    )
    .get(slug) as unknown as ListingRecord | undefined;

  if (!row) return { listing: null, vendor: null, related: [] };

  db.prepare(`UPDATE listings SET views_count = views_count + 1 WHERE id = ?`).run(row.id);

  const vendor = db.prepare(`SELECT * FROM vendors WHERE id = ?`).get(row.vendor_id) as unknown as VendorRecord;
  const related = db
    .prepare(
      `SELECT l.*, v.business_name as vendor_name,
              CASE WHEN v.verification_status = 'approved' THEN 1 ELSE 0 END as vendor_verified
       FROM listings l
       JOIN vendors v ON v.id = l.vendor_id
       WHERE l.status = 'approved' AND v.verification_status = 'approved'
         AND l.id != ? AND (l.category_slug = ? OR l.type = ?)
       ORDER BY CASE WHEN l.category_slug = ? THEN 0 ELSE 1 END, l.id DESC
       LIMIT 4`
    )
    .all(row.id, row.category_slug, row.type, row.category_slug) as unknown as ListingRecord[];

  return {
    listing: { ...row, vendor_verified: Boolean(row.vendor_verified) },
    vendor: toPlain(vendor) || null,
    related: related.map((r) => ({ ...r, vendor_verified: Boolean(r.vendor_verified) })),
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

