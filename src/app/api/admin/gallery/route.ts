import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/data";

export async function POST(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = (await req.json()) as {
    title?: string;
    category?: string;
    imageUrl?: string;
    caption?: string;
  };

  if (!body.title || !body.imageUrl) {
    return NextResponse.json({ error: "Title and image URL are required." }, { status: 400 });
  }

  const db = getDb();
  const res = db
    .prepare(`INSERT INTO gallery_items (title, category, image_url, caption, sort_order) VALUES (?, ?, ?, ?, 0)`)
    .run(body.title.trim(), body.category || "Industrial", body.imageUrl.trim(), body.caption || "");

  return NextResponse.json({ success: true, id: Number(res.lastInsertRowid) }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  const db = getDb();
  db.prepare(`DELETE FROM gallery_items WHERE id = ?`).run(id);
  return NextResponse.json({ success: true });
}

