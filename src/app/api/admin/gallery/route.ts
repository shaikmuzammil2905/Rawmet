import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb, syncDbFromS3, syncDbToS3 } from "@/lib/db";
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

  try {
    await syncDbFromS3(true);
    const db = getDb();
    const res = db
      .prepare(`INSERT INTO gallery_items (title, category, image_url, caption, sort_order) VALUES (?, ?, ?, ?, 0)`)
      .run(body.title.trim(), body.category || "Industrial", body.imageUrl.trim(), body.caption || "");

    await syncDbToS3();
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, id: Number(res.lastInsertRowid) }, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to add gallery item.";
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
    const db = getDb();
    db.prepare(`DELETE FROM gallery_items WHERE id = ?`).run(id);
    await syncDbToS3();
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to delete gallery item.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

