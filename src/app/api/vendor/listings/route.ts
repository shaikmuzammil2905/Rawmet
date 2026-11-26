import { NextResponse } from "next/server";
import { getDb, syncDbFromS3, syncDbToS3 } from "@/lib/db";
import { requireRole, slugify } from "@/lib/data";

export async function GET() {
  await syncDbFromS3();
  const session = await requireRole(["vendor", "admin"]);
  if (!session || !session.vendor) {
    return NextResponse.json({ error: "Vendor authentication required." }, { status: 401 });
  }
  const db = getDb();
  const listings = db
    .prepare(
      `SELECT l.*,
              m.title as master_title,
              m.image_url as master_image_url
       FROM listings l
       LEFT JOIN listings m ON m.id = l.master_product_id
       WHERE l.vendor_id = ?
       ORDER BY l.id DESC`
    )
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

  const allowance = sub ? (sub.listing_allowance || 100) : 100;
  const planName = sub ? sub.plan_name : "Standard Plan";

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
  await syncDbFromS3(true);
  const session = await requireRole(["vendor"]);
  if (!session || !session.vendor) {
    return NextResponse.json({ error: "Vendor authentication required." }, { status: 401 });
  }

  if (session.vendor.verification_status !== "approved") {
    return NextResponse.json(
      {
        error: `Your seller registration is currently under admin verification. You will be able to access your seller dashboard once approved. Current status: ${session.vendor.verification_status.toUpperCase()}.`,
      },
      { status: 403 }
    );
  }

  const db = getDb();

  try {
    const body = (await req.json()) as {
      master_product_id?: number;
      type?: "product" | "machinery" | "service";
      category_slug?: string;
      subcategory_slug?: string;
      title?: string;
      price_numeric?: number;
      price_unit?: string;
      price_display?: string;
      min_order_qty?: string;
      availability?: string;
      specifications?: Record<string, string> | string;
      location?: string;
      description?: string;
    };

    const masterId = Number(body.master_product_id || 0);
    if (!masterId) {
      return NextResponse.json(
        { error: "Please select an existing admin-approved product from the catalogue." },
        { status: 400 }
      );
    }

    // Fetch the master product
    const master = db
      .prepare(
        `SELECT * FROM listings WHERE id = ? AND (master_product_id IS NULL OR master_product_id = 0 OR is_master = 1)`
      )
      .get(masterId) as Record<string, unknown> | undefined;

    if (!master) {
      return NextResponse.json(
        { error: "Selected product not found in the master catalogue." },
        { status: 404 }
      );
    }

    const priceNumeric = Number(body.price_numeric || 0);
    const priceUnit = (body.price_unit || "Unit").trim();
    const priceDisplay =
      body.price_display || (priceNumeric > 0 ? `₹${priceNumeric} / ${priceUnit}` : "Request Quote");
    const minOrderQty = (body.min_order_qty || "1").trim();
    const availability = (body.availability || "In Stock").trim();
    const location = (body.location || session.vendor.city || "Pan India").trim();
    const sellerDesc = (body.description || "").trim() || String(master.description || "");

    let specsObj: Record<string, string> = {};
    if (typeof body.specifications === "string") {
      try {
        specsObj = JSON.parse(body.specifications);
      } catch {
        specsObj = { Specifications: body.specifications };
      }
    } else if (body.specifications && typeof body.specifications === "object") {
      specsObj = body.specifications;
    }

    // Generate unique slug
    const baseSlug = `${slugify(String(master.title))}-${session.vendor.id}`;
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    // Automatic approval for listings of existing admin products!
    const res = db
      .prepare(
        `INSERT INTO listings (
          vendor_id, master_product_id, type, category_slug, subcategory_slug, title, slug,
          short_description, description, specifications, location, price_display,
          price_numeric, price_unit, min_order_qty, availability, image_url, gallery_urls,
          status, is_published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1)`
      )
      .run(
        session.vendor.id,
        master.id,
        master.type,
        master.category_slug,
        master.subcategory_slug || "",
        master.title,
        uniqueSlug,
        master.short_description || master.title,
        sellerDesc,
        JSON.stringify(specsObj),
        location,
        priceDisplay,
        priceNumeric,
        priceUnit,
        minOrderQty,
        availability,
        master.image_url,
        master.gallery_urls || JSON.stringify([master.image_url])
      );

    db.prepare(`
      INSERT INTO audit_logs (
        user_id, user_email, action, entity_type, entity_id,
        target_user_id, previous_status, new_status, details
      ) VALUES (?, ?, 'Seller Listing Created', 'listing', ?, ?, 'none', 'approved', ?)
    `).run(
      session.user.id,
      session.user.email,
      Number(res.lastInsertRowid),
      session.user.id,
      `Vendor #${session.vendor.id} (${session.vendor.business_name}) created listing '${master.title}' @ ${priceDisplay}`
    );

    await syncDbToS3();

    return NextResponse.json(
      {
        success: true,
        id: Number(res.lastInsertRowid),
        message: "Your listing has been automatically published and is now live on RAWMAT MART!",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Listing publish error:", err);
    return NextResponse.json({ error: "Failed to publish listing." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  await syncDbFromS3(true);
  const session = await requireRole(["vendor"]);
  if (!session || !session.vendor) {
    return NextResponse.json({ error: "Vendor authentication required." }, { status: 401 });
  }
  if (session.vendor.verification_status !== "approved") {
    return NextResponse.json(
      { error: "Only approved active sellers can modify listings." },
      { status: 403 }
    );
  }

  try {
    const body = (await req.json()) as {
      id?: number;
      price_numeric?: number;
      price_unit?: string;
      price_display?: string;
      min_order_qty?: string;
      availability?: string;
      location?: string;
      description?: string;
      specifications?: Record<string, string>;
      is_published?: number | boolean;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Listing id is required." }, { status: 400 });
    }

    const db = getDb();
    const existing = db
      .prepare(`SELECT id, status FROM listings WHERE id = ? AND vendor_id = ?`)
      .get(body.id, session.vendor.id) as { id: number; status: string } | undefined;

    if (!existing) {
      return NextResponse.json({ error: "Listing not found or access denied." }, { status: 404 });
    }

    let isPubVal: number | null = null;
    if (typeof body.is_published === "boolean") {
      isPubVal = body.is_published ? 1 : 0;
    } else if (typeof body.is_published === "number") {
      isPubVal = body.is_published;
    }

    const priceNumeric = body.price_numeric !== undefined ? Number(body.price_numeric) : null;
    const priceUnit = body.price_unit ? body.price_unit.trim() : null;
    let priceDisplay = body.price_display ?? null;
    if (priceNumeric !== null && priceUnit !== null && !priceDisplay) {
      priceDisplay = `₹${priceNumeric} / ${priceUnit}`;
    }

    db.prepare(
      `UPDATE listings SET
        price_numeric = COALESCE(?, price_numeric),
        price_unit = COALESCE(?, price_unit),
        price_display = COALESCE(?, price_display),
        min_order_qty = COALESCE(?, min_order_qty),
        availability = COALESCE(?, availability),
        location = COALESCE(?, location),
        description = COALESCE(?, description),
        specifications = COALESCE(?, specifications),
        is_published = COALESCE(?, is_published),
        updated_at = datetime('now')
      WHERE id = ? AND vendor_id = ?`
    ).run(
      priceNumeric,
      priceUnit,
      priceDisplay,
      body.min_order_qty ? body.min_order_qty.trim() : null,
      body.availability ? body.availability.trim() : null,
      body.location ? body.location.trim() : null,
      body.description ? body.description.trim() : null,
      body.specifications ? JSON.stringify(body.specifications) : null,
      isPubVal,
      body.id,
      session.vendor.id
    );

    const actionName = isPubVal === 0 ? "Seller Listing Deactivated" : "Seller Listing Updated";
    db.prepare(`
      INSERT INTO audit_logs (
        user_id, user_email, action, entity_type, entity_id,
        target_user_id, previous_status, new_status, details
      ) VALUES (?, ?, ?, 'listing', ?, ?, ?, ?, ?)
    `).run(
      session.user.id,
      session.user.email,
      actionName,
      body.id,
      session.user.id,
      existing.status,
      isPubVal === 0 ? "deactivated" : existing.status,
      `Vendor #${session.vendor.id} updated listing #${body.id}`
    );

    await syncDbToS3();

    return NextResponse.json({ success: true, message: "Listing updated successfully." });
  } catch (err: unknown) {
    console.error("Listing update error:", err);
    return NextResponse.json({ error: "Failed to update listing." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  await syncDbFromS3(true);
  const session = await requireRole(["vendor"]);
  if (!session || !session.vendor) {
    return NextResponse.json({ error: "Vendor authentication required." }, { status: 401 });
  }
  if (session.vendor.verification_status !== "approved") {
    return NextResponse.json(
      { error: "Only approved active sellers can delete listings." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  if (!id) {
    return NextResponse.json({ error: "Listing id required." }, { status: 400 });
  }

  const db = getDb();
  db.prepare(`DELETE FROM listings WHERE id = ? AND vendor_id = ?`).run(id, session.vendor.id);
  await syncDbToS3();

  return NextResponse.json({ success: true, message: "Listing deleted successfully." });
}
