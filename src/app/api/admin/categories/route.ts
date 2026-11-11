import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireRole, slugify } from "@/lib/data";

export async function POST(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  try {
    const body = (await req.json()) as {
      kind?: "category" | "subcategory";
      type?: "product" | "machinery" | "service";
      categoryId?: number;
      name?: string;
      description?: string;
      imageUrl?: string;
    };

    const name = (body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

    const db = getDb();
    if (body.kind === "subcategory" && body.categoryId) {
      const slug = `${slugify(name)}-${Date.now().toString(36)}`;
      db.prepare(`INSERT INTO subcategories (category_id, name, slug, description) VALUES (?, ?, ?, ?)`).run(
        body.categoryId,
        name,
        slug,
        body.description || ""
      );
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const slug = slugify(name);
    db.prepare(
      `INSERT INTO categories (type, name, slug, description, image_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, 10, 1)`
    ).run(
      body.type || "product",
      name,
      `${slug}-${Date.now().toString(36).slice(-3)}`,
      body.description || "",
      body.imageUrl || "/images/cat-products.png"
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save category." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

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
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  const kind = searchParams.get("kind") || "category";
  const db = getDb();

  if (kind === "subcategory") {
    db.prepare(`DELETE FROM subcategories WHERE id = ?`).run(id);
  } else {
    db.prepare(`DELETE FROM categories WHERE id = ?`).run(id);
  }
  return NextResponse.json({ success: true });
}

