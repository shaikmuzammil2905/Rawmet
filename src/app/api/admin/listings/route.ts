import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb, syncDbFromS3, syncDbToS3, withDbMutation } from "@/lib/db";
import { requireRole, slugify } from "@/lib/data";

export async function POST(req: Request) {
  await syncDbFromS3(true);
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

    const slug = `${slugify(body.title)}-${Date.now().toString(36)}`;
    const inserted = await withDbMutation((db) => {
      const vendorId = body.vendor_id ? Number(body.vendor_id) : null;
      const isMaster = body.vendor_id ? 0 : 1;

      const res = db
        .prepare(
          `INSERT INTO listings (
            vendor_id, type, category_slug, subcategory_slug, title, slug,
            short_description, description, specifications, location,
            price_display, availability, image_url, gallery_urls, status, featured, is_published, is_master
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
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
          body.featured ? 1 : 0,
          isMaster
        );

      db.prepare(`
        INSERT INTO audit_logs (user_id, user_email, action, details)
        VALUES (?, ?, 'admin_created_listing', ?)
      `).run(
        session.user.id,
        session.user.email,
        `Listing '${body.title}' (${body.type}) created by Admin`
      );

      return db.prepare(`SELECT * FROM listings WHERE id = ?`).get(res.lastInsertRowid);
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/dashboard");
    return NextResponse.json(
      { success: true, id: (inserted as { id: number }).id, slug, listing: inserted },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Admin listings POST error:", err);
    const msg = err instanceof Error ? err.message : "Failed to add listing.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  await syncDbFromS3(true);
  const body = (await req.json()) as {
    id?: number;
    status?: "approved" | "pending" | "rejected";
    rejection_reason?: string;
    is_published?: boolean;
    featured?: boolean;
    title?: string;
    category_slug?: string;
    subcategory_slug?: string;
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
      rejection_reason = COALESCE(?, rejection_reason),
      is_published = COALESCE(?, is_published),
      featured = COALESCE(?, featured),
      title = COALESCE(?, title),
      category_slug = COALESCE(?, category_slug),
      subcategory_slug = COALESCE(?, subcategory_slug),
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
    body.status === "rejected" ? (body.rejection_reason || "Requires specification revision.") : null,
    typeof body.is_published === "boolean" ? (body.is_published ? 1 : 0) : null,
    typeof body.featured === "boolean" ? (body.featured ? 1 : 0) : null,
    body.title ?? null,
    body.category_slug ?? null,
    body.subcategory_slug ?? null,
    body.short_description ?? null,
    body.description ?? null,
    body.price_display ?? null,
    body.location ?? null,
    body.availability ?? null,
    body.image_url ?? null,
    body.id
  );

  await syncDbToS3();
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  await syncDbFromS3(true);
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  const db = getDb();
  db.prepare(`DELETE FROM listings WHERE id = ?`).run(id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_email, action, details)
    VALUES (?, ?, 'admin_deleted_listing', ?)
  `).run(
    session.user.id,
    session.user.email,
    `Listing #${id} deleted by Admin`
  );

  await syncDbToS3();
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
