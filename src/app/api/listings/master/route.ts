import { NextResponse } from "next/server";
import { getDb, syncDbFromS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    await syncDbFromS3(true);
    ensureSeeded();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "";
    const categorySlug = searchParams.get("category_slug") || "";
    const subcategorySlug = searchParams.get("subcategory_slug") || "";

    const db = getDb();

    // Query master products created by admin (master_product_id IS NULL or is_master = 1)
    let query = `
      SELECT id, title, type, category_slug, subcategory_slug, image_url,
             short_description, description, specifications, price_display
      FROM listings
      WHERE (master_product_id IS NULL OR master_product_id = 0 OR is_master = 1)
        AND (status = 'approved' OR status IS NULL)
    `;
    const params: unknown[] = [];

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }
    if (categorySlug) {
      query += ` AND category_slug = ?`;
      params.push(categorySlug);
    }
    if (subcategorySlug) {
      query += ` AND subcategory_slug = ?`;
      params.push(subcategorySlug);
    }

    query += ` ORDER BY title ASC`;

    const products = db.prepare(query).all(...params);

    return NextResponse.json(
      {
        success: true,
        products,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    console.error("Master listings error:", err);
    return NextResponse.json({ error: "Failed to fetch master products." }, { status: 500 });
  }
}
