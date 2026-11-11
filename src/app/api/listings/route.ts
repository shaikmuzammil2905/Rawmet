import { NextResponse } from "next/server";
import { getCategories, getRequirements, queryListings } from "@/lib/data";
import { getDb } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";

export async function GET(req: Request) {
  ensureSeeded();
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") || "") as "product" | "machinery" | "service" | "";
  const category = searchParams.get("category") || "";
  const subcategory = searchParams.get("subcategory") || "";
  const q = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const vendorId = Number(searchParams.get("vendorId") || 0) || undefined;
  const sort = (searchParams.get("sort") || "newest") as "newest" | "views" | "title";
  const limit = Number(searchParams.get("limit") || 24);
  const offset = Number(searchParams.get("offset") || 0);
  const includeGlobal = searchParams.get("global") === "1";

  const { items, total } = queryListings({
    type,
    category,
    subcategory,
    q,
    location,
    vendorId,
    sort,
    limit,
    offset,
  });

  if (!includeGlobal) {
    return NextResponse.json({ items, total, categories: getCategories(type || undefined) });
  }

  const db = getDb();
  const qLike = `%${q.toLowerCase()}%`;
  const vendors = q
    ? db
        .prepare(
          `SELECT id, business_name, city, state, product_service_category, business_category, description
           FROM vendors
           WHERE verification_status = 'approved'
             AND (LOWER(business_name) LIKE ? OR LOWER(product_details) LIKE ? OR LOWER(city) LIKE ?)
           LIMIT 12`
        )
        .all(qLike, qLike, qLike)
    : [];

  const requirements = getRequirements({ q, category: category || "all", limit: 12 });

  return NextResponse.json({
    items,
    total,
    vendors,
    requirements,
    categories: getCategories(),
  });
}

