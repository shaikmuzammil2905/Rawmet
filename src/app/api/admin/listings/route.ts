import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireRole, slugify } from "@/lib/data";

export async function POST(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  try {
    const body = (await req.json()) as {
      vendor_id?: number;
      type: "product" | "machinery" | "service";
      category_slug: string;
      subcategory_slug?: string;
      title: string;
      short_description?: string;
      description?: string;
      specifications?: Record<string, string>;
      location?: string;
      price_display?: string;
      availability?: string;
      image_url?: string;
      featured?: boolean;
      status?: "approved" | "pending" | "rejected";
    };

    const db = getDb();
    let vendorId = body.vendor_id;
    if (!vendorId) {
      const firstVendor = db.prepare(`SELECT id FROM vendors WHERE verification_status = 'approved' LIMIT 1`).get() as
        | { id: number }
        | undefined;
      vendorId = firstVendor?.id || 1;
    }

    const slug = `${slugify(body.title)}-${Date.now().toString(36)}`;
    const res = db
      .prepare(
        `INSERT INTO listings (
          vendor_id, type, category_slug, subcategory_slug, title, slug,
          short_description, description, specifications, location,
          price_display, availability, image_url, gallery_urls, status, featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        vendorId,
        body.type,
        body.category_slug,
        body.subcategory_slug || "",
        body.title.trim(),
        slug,
        body.short_description || body.title.trim(),
        body.description || "",
        JSON.stringify(body.specifications || {}),
        body.location || "Pan India",
        body.price_display || "Request Quote",
        body.availability || "In Stock",
        body.image_url || "/images/cat-products.png",
        JSON.stringify([body.image_url || "/images/cat-products.png"]),
        body.status || "approved",
        body.featured ? 1 : 0
      );

    return NextResponse.json({ success: true, id: Number(res.lastInsertRowid) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add listing." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = (await req.json()) as {
    id?: number;
    status?: "approved" | "pending" | "rejected";
    featured?: boolean;
    title?: string;
    category_slug?: string;
    short_description?: string;
    description?: string;
    price_display?: string;
    location?: string;
    availability?: string;
    image_url?: string;
  };

  if (!body.id) return NextResponse.json({ error: "Listing ID required." }, { status: 400 });

  const db = getDb();
  db.prepare(
    `UPDATE listings SET
      status = COALESCE(?, status),
      featured = COALESCE(?, featured),
      title = COALESCE(?, title),
      category_slug = COALESCE(?, category_slug),
      short_description = COALESCE(?, short_description),
      description = COALESCE(?, description),
      price_display = COALESCE(?, price_display),
      location = COALESCE(?, location),
      availability = COALESCE(?, availability),
      image_url = COALESCE(?, image_url),
      updated_at = datetime('now')
    WHERE id = ?`
  ).run(
    body.status ?? null,
    typeof body.featured === "boolean" ? (body.featured ? 1 : 0) : null,
    body.title ?? null,
    body.category_slug ?? null,
    body.short_description ?? null,
    body.description ?? null,
    body.price_display ?? null,
    body.location ?? null,
    body.availability ?? null,
    body.image_url ?? null,
    body.id
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  const db = getDb();
  db.prepare(`DELETE FROM listings WHERE id = ?`).run(id);
  return NextResponse.json({ success: true });
}

