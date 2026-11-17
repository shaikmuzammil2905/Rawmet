import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireRole, slugify } from "@/lib/data";

export async function GET() {
  const session = await requireRole(["vendor", "admin"]);
  if (!session || !session.vendor) {
    return NextResponse.json({ error: "Vendor authentication required." }, { status: 401 });
  }
  const db = getDb();
  const listings = db
    .prepare(`SELECT * FROM listings WHERE vendor_id = ? ORDER BY id DESC`)
    .all(session.vendor.id);

  // Check active subscription quota
  const sub = db
    .prepare(
      `SELECT us.*, sp.name as plan_name, sp.listing_allowance
       FROM user_subscriptions us
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE us.user_id = ? AND us.status = 'active' AND datetime(us.ends_at) > datetime('now')
       ORDER BY sp.listing_allowance DESC, us.id DESC
       LIMIT 1`
    )
    .get(session.user.id) as { plan_name: string; listing_allowance: number } | undefined;

  const allowance = sub ? (sub.listing_allowance || 100) : 2;
  const planName = sub ? sub.plan_name : "Free Tier (2 Listings)";

  return NextResponse.json({
    listings,
    vendor: session.vendor,
    quota: {
      used: listings.length,
      allowance,
      planName,
    },
  });
}

export async function POST(req: Request) {
  const session = await requireRole(["vendor"]);
  if (!session || !session.vendor) {
    return NextResponse.json({ error: "Vendor authentication required." }, { status: 401 });
  }

  if (session.vendor.verification_status !== "approved") {
    return NextResponse.json(
      {
        error: `Free listings require GST / Authentic ID verification approval. Current status: ${session.vendor.verification_status.toUpperCase()}.`,
      },
      { status: 403 }
    );
  }

  const db = getDb();

  // Enforce listing allowance quota
  const sub = db
    .prepare(
      `SELECT us.*, sp.name as plan_name, sp.listing_allowance
       FROM user_subscriptions us
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE us.user_id = ? AND us.status = 'active' AND datetime(us.ends_at) > datetime('now')
       ORDER BY sp.listing_allowance DESC, us.id DESC
       LIMIT 1`
    )
    .get(session.user.id) as { plan_name: string; listing_allowance: number } | undefined;

  const allowance = sub ? (sub.listing_allowance || 100) : 2;
  const planName = sub ? sub.plan_name : "Free Tier (2 Listings)";

  const currentCount = (
    db.prepare(`SELECT COUNT(*) as c FROM listings WHERE vendor_id = ?`).get(session.vendor.id) as { c: number }
  ).c;

  if (currentCount >= allowance) {
    return NextResponse.json(
      {
        error: `Listing quota reached (${currentCount}/${allowance}). Your plan "${planName}" allows up to ${allowance} active catalog listings. Please upgrade your subscription plan to publish more products.`,
      },
      { status: 403 }
    );
  }

  try {
    const body = (await req.json()) as {
      type?: "product" | "machinery" | "service";
      category_slug?: string;
      subcategory_slug?: string;
      title?: string;
      short_description?: string;
      description?: string;
      specifications?: Record<string, string>;
      location?: string;
      price_display?: string;
      availability?: string;
      image_url?: string;
      gallery_urls?: string[];
    };

    const title = (body.title || "").trim();
    const categorySlug = (body.category_slug || "").trim();
    if (!title || !categorySlug || !body.type) {
      return NextResponse.json({ error: "Listing type, category, and title are required." }, { status: 400 });
    }

    const baseSlug = slugify(title);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const res = db
      .prepare(
        `INSERT INTO listings (
          vendor_id, type, category_slug, subcategory_slug, title, slug,
          short_description, description, specifications, location, price_display,
          availability, image_url, gallery_urls, status, is_published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1)`
      )
      .run(
        session.vendor.id,
        body.type,
        categorySlug,
        body.subcategory_slug || "",
        title,
        uniqueSlug,
        body.short_description || title,
        body.description || "",
        JSON.stringify(body.specifications || {}),
        body.location || `${session.vendor.city || "India"}`,
        body.price_display || "Request Quote",
        body.availability || "In Stock",
        body.image_url || "/images/cat-products.png",
        JSON.stringify(body.gallery_urls || [body.image_url || "/images/cat-products.png"])
      );

    db.prepare(`
      INSERT INTO audit_logs (user_id, user_email, action, details)
      VALUES (?, ?, 'vendor_submitted_listing', ?)
    `).run(
      session.user.id,
      session.user.email,
      `Vendor #${session.vendor.id} submitted listing '${title}' for approval`
    );

    return NextResponse.json(
      {
        success: true,
        id: Number(res.lastInsertRowid),
        message: "Listing submitted for Admin approval.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create listing." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await requireRole(["vendor"]);
  if (!session || !session.vendor) {
    return NextResponse.json({ error: "Vendor authentication required." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      id?: number;
      type?: "product" | "machinery" | "service";
      category_slug?: string;
      subcategory_slug?: string;
      title?: string;
      short_description?: string;
      description?: string;
      specifications?: Record<string, string>;
      location?: string;
      price_display?: string;
      availability?: string;
      image_url?: string;
      gallery_urls?: string[];
    };

    if (!body.id) {
      return NextResponse.json({ error: "Listing id is required." }, { status: 400 });
    }

    const db = getDb();
    const existing = db
      .prepare(`SELECT id FROM listings WHERE id = ? AND vendor_id = ?`)
      .get(body.id, session.vendor.id);

    if (!existing) {
      return NextResponse.json({ error: "Listing not found or access denied." }, { status: 404 });
    }

    db.prepare(
      `UPDATE listings SET
        type = COALESCE(?, type),
        category_slug = COALESCE(?, category_slug),
        subcategory_slug = COALESCE(?, subcategory_slug),
        title = COALESCE(?, title),
        short_description = COALESCE(?, short_description),
        description = COALESCE(?, description),
        specifications = COALESCE(?, specifications),
        location = COALESCE(?, location),
        price_display = COALESCE(?, price_display),
        availability = COALESCE(?, availability),
        image_url = COALESCE(?, image_url),
        gallery_urls = COALESCE(?, gallery_urls),
        status = 'pending',
        updated_at = datetime('now')
      WHERE id = ? AND vendor_id = ?`
    ).run(
      body.type ?? null,
      body.category_slug ?? null,
      body.subcategory_slug ?? null,
      body.title ? body.title.trim() : null,
      body.short_description ? body.short_description.trim() : null,
      body.description ?? null,
      body.specifications ? JSON.stringify(body.specifications) : null,
      body.location ?? null,
      body.price_display ?? null,
      body.availability ?? null,
      body.image_url ?? null,
      body.gallery_urls ? JSON.stringify(body.gallery_urls) : null,
      body.id,
      session.vendor.id
    );

    return NextResponse.json({ success: true, message: "Listing updated and resubmitted for Admin review." });
  } catch {
    return NextResponse.json({ error: "Failed to update listing." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await requireRole(["vendor"]);
  if (!session || !session.vendor) {
    return NextResponse.json({ error: "Vendor authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  if (!id) {
    return NextResponse.json({ error: "Listing id required." }, { status: 400 });
  }

  const db = getDb();
  db.prepare(`DELETE FROM listings WHERE id = ? AND vendor_id = ?`).run(id, session.vendor.id);

  return NextResponse.json({ success: true, message: "Listing deleted successfully." });
}
