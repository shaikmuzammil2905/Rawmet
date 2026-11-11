import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/data";

const ALLOWED_KEYS = new Set([
  "hero_slides",
  "about_content",
  "launching_offer",
  "contact_settings",
  "business_support",
]);

export async function PATCH(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = (await req.json()) as { key?: string; value?: unknown };
  if (!body.key || !ALLOWED_KEYS.has(body.key) || body.value === undefined) {
    return NextResponse.json({ error: "Valid CMS key and value are required." }, { status: 400 });
  }

  const db = getDb();
  db.prepare(
    `INSERT INTO site_content (key, value, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(body.key, JSON.stringify(body.value));

  return NextResponse.json({ success: true });
}

