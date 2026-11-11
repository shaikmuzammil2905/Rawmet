import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/data";

export async function PATCH(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = (await req.json()) as {
    id?: number;
    name?: string;
    price_inr?: number;
    duration_months?: number;
    bonus_months?: number;
    badge_text?: string;
    highlight_text?: string;
    features?: string[];
    is_active?: boolean;
  };

  if (!body.id) return NextResponse.json({ error: "Plan ID required." }, { status: 400 });

  const db = getDb();
  db.prepare(
    `UPDATE subscription_plans SET
      name = COALESCE(?, name),
      price_inr = COALESCE(?, price_inr),
      duration_months = COALESCE(?, duration_months),
      bonus_months = COALESCE(?, bonus_months),
      badge_text = COALESCE(?, badge_text),
      highlight_text = COALESCE(?, highlight_text),
      features = COALESCE(?, features),
      is_active = COALESCE(?, is_active)
    WHERE id = ?`
  ).run(
    body.name ?? null,
    body.price_inr ?? null,
    body.duration_months ?? null,
    body.bonus_months ?? null,
    body.badge_text ?? null,
    body.highlight_text ?? null,
    body.features ? JSON.stringify(body.features) : null,
    typeof body.is_active === "boolean" ? (body.is_active ? 1 : 0) : null,
    body.id
  );

  return NextResponse.json({ success: true });
}

