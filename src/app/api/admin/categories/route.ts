import { NextResponse } from "next/server";
import { getDb, syncDbFromS3, syncDbToS3 } from "@/lib/db";
import { requireRole, slugify } from "@/lib/data";

export async function POST(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  try {
    await syncDbFromS3(true);
    const body = (await req.json()) as {
      kind?: "category" | "subcategory";
      type?: "product" | "machinery" | "service";
      categoryId?: number | string;
      name?: string;
      description?: string;
      imageUrl?: string;
    };

    const name = (body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

    const db = getDb();

    // 1. Create Subcategory
    if (body.kind === "subcategory") {
      const categoryId = Number(body.categoryId);
      if (!categoryId || isNaN(categoryId)) {
        return NextResponse.json({ error: "Please select a valid parent main category." }, { status: 400 });
      }

      const parent = db.prepare(`SELECT id, name, type FROM categories WHERE id = ?`).get(categoryId) as
        | { id: number; name: string; type: string }
        | undefined;
      if (!parent) {
        return NextResponse.json(
          { error: `Selected parent category (ID ${categoryId}) not found in database.` },
          { status: 400 }
        );
      }

      // Check if subcategory already exists under this category
      const existingSub = db.prepare(
        `SELECT id FROM subcategories WHERE category_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?))`
      ).get(categoryId, name);
      if (existingSub) {
        return NextResponse.json(
          { error: `Subcategory "${name}" already exists under ${parent.name}.` },
          { status: 400 }
        );
      }

      const baseSlug = slugify(name);
      const existingSlug = db.prepare(`SELECT id FROM subcategories WHERE slug = ?`).get(baseSlug);
      const slug = existingSlug ? `${baseSlug}-${Date.now().toString(36).slice(-4)}` : baseSlug;

      const res = db.prepare(`INSERT INTO subcategories (category_id, name, slug, description) VALUES (?, ?, ?, ?)`).run(
        categoryId,
        name,
        slug,
        body.description || ""
      );

      await syncDbToS3();
      return NextResponse.json(
        { success: true, id: Number(res.lastInsertRowid), name, slug, categoryId },
        { status: 201 }
      );
    }

    // 2. Create Main Category
    const type = body.type || "product";
    const existingByName = db.prepare(
      `SELECT id, name FROM categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND type = ?`
    ).get(name, type) as { id: number; name: string } | undefined;

    if (existingByName) {
      return NextResponse.json(
        { error: `Category "${name}" already exists under ${type}s.` },
        { status: 400 }
      );
    }

    const baseSlug = slugify(name);
    const existingSlug = db.prepare(`SELECT id FROM categories WHERE slug = ?`).get(baseSlug);
    const slug = existingSlug ? `${baseSlug}-${Date.now().toString(36).slice(-4)}` : baseSlug;

    const res = db.prepare(
      `INSERT INTO categories (type, name, slug, description, image_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, 10, 1)`
    ).run(
      type,
      name,
      slug,
      body.description || "",
      body.imageUrl || "/images/cat-products.png"
    );

    await syncDbToS3();
    return NextResponse.json(
      { success: true, id: Number(res.lastInsertRowid), name, slug, type },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to save category.";
    console.error("Categories POST error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  try {
    await syncDbFromS3(true);
    const body = (await req.json()) as {
      kind?: "category" | "subcategory";
      id?: number;
      name?: string;
      description?: string;
      imageUrl?: string;
      isActive?: boolean;
    };
    if (!body.id) return NextResponse.json({ error: "ID required." }, { status: 400 });

    const db = getDb();
    if (body.kind === "subcategory") {
      db.prepare(`UPDATE subcategories SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?`).run(
        body.name ?? null,
        body.description ?? null,
        body.id
      );
      await syncDbToS3();
      return NextResponse.json({ success: true });
    }

    db.prepare(
      `UPDATE categories SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        image_url = COALESCE(?, image_url),
        is_active = COALESCE(?, is_active)
      WHERE id = ?`
    ).run(
      body.name ?? null,
      body.description ?? null,
      body.imageUrl ?? null,
      typeof body.isActive === "boolean" ? (body.isActive ? 1 : 0) : null,
      body.id
    );
    await syncDbToS3();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to update category.";
    console.error("Categories PATCH error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  try {
    await syncDbFromS3(true);
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const kind = searchParams.get("kind") || "category";
    if (!id || isNaN(id)) return NextResponse.json({ error: "Valid ID required." }, { status: 400 });

    const db = getDb();

    if (kind === "subcategory") {
      db.prepare(`DELETE FROM subcategories WHERE id = ?`).run(id);
    } else {
      db.prepare(`DELETE FROM subcategories WHERE category_id = ?`).run(id);
      db.prepare(`DELETE FROM categories WHERE id = ?`).run(id);
    }
    await syncDbToS3();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to delete category.";
    console.error("Categories DELETE error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

