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

  return NextResponse.json({ listings, vendor: session.vendor });
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

    const db = getDb();
    const baseSlug = slugify(title);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const res = db
      .prepare(
        `INSERT INTO listings (
          vendor_id, type, category_slug, subcategory_slug, title, slug,
          short_description, description, specifications, location, price_display,
          availability, image_url, gallery_urls, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
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
      title?: string;
      short_description?: string;
      description?: string;
      location?: string;
      price_display?: string;
      availability?: string;
      image_url?: string;
      category_slug?: string;
      specifications?: Record<string, string>;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Listing ID required." }, { status: 400 });
    }

    const db = getDb();
    const existing = db
      .prepare(`SELECT id FROM listings WHERE id = ? AND vendor_id = ?`)
      .get(body.id, session.vendor.id);

    if (!existing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    db.prepare(
      `UPDATE listings SET
        title = COALESCE(?, title),
        category_slug = COALESCE(?, category_slug),
        short_description = COALESCE(?, short_description),
        description = COALESCE(?, description),
        location = COALESCE(?, location),
        price_display = COALESCE(?, price_display),
        availability = COALESCE(?, availability),
        image_url = COALESCE(?, image_url),
        specifications = COALESCE(?, specifications),
        status = 'pending',
        updated_at = datetime('now')
      WHERE id = ? AND vendor_id = ?`
    ).run(
      body.title ?? null,
      body.category_slug ?? null,
      body.short_description ?? null,
      body.description ?? null,
      body.location ?? null,
      body.price_display ?? null,
      body.availability ?? null,
      body.image_url ?? null,
      body.specifications ? JSON.stringify(body.specifications) : null,
      body.id,
      session.vendor.id
    );

    return NextResponse.json({ success: true, message: "Listing updated and queued for review." });
  } catch {
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await requireRole(["vendor"]);
  if (!session || !session.vendor) {
    return NextResponse.json({ error: "Vendor authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Listing ID required." }, { status: 400 });

  const db = getDb();
  const res = db.prepare(`DELETE FROM listings WHERE id = ? AND vendor_id = ?`).run(id, session.vendor.id);
  if (res.changes === 0) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

