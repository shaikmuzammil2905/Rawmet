import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentSession, getRequirements } from "@/lib/data";
import { dispatchWhatsAppOpportunity } from "@/lib/whatsapp";
import type { RequirementRecord } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "all";
  const q = searchParams.get("q") || "";
  const items = getRequirements({ category, q, limit: 50 });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    const body = (await req.json()) as {
      name?: string;
      businessName?: string;
      mobile?: string;
      whatsapp?: string;
      email?: string;
      categoryType?: "product" | "machinery" | "service";
      categorySlug?: string;
      title?: string;
      quantity?: string;
      location?: string;
      description?: string;
      attachmentUrl?: string;
    };

    const name = (body.name || "").trim();
    const mobile = (body.mobile || "").replace(/\D/g, "").slice(-10);
    const whatsapp = (body.whatsapp || mobile).replace(/\D/g, "");
    const title = (body.title || "").trim();
    const categorySlug = (body.categorySlug || "rubber").trim();

    if (!name || mobile.length !== 10 || !title || !categorySlug) {
      return NextResponse.json(
        { error: "Name, 10-digit mobile, requirement category, and title are required." },
        { status: 400 }
      );
    }

    const db = getDb();
    const res = db
      .prepare(
        `INSERT INTO requirements (
          user_id, name, business_name, mobile, whatsapp, email,
          category_type, category_slug, title, quantity, location,
          description, attachment_url, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`
      )
      .run(
        session?.user.id ?? null,
        name,
        body.businessName || "",
        mobile,
        whatsapp || `91${mobile}`,
        body.email || "",
        body.categoryType || "product",
        categorySlug,
        title,
        body.quantity || "",
        body.location || "",
        body.description || "",
        body.attachmentUrl || ""
      );

    const created = db
      .prepare(`SELECT * FROM requirements WHERE id = ?`)
      .get(res.lastInsertRowid) as unknown as RequirementRecord;

    const waResult = dispatchWhatsAppOpportunity(created);

    return NextResponse.json(
      {
        success: true,
        requirement: { ...created, matched_vendors_count: waResult.matchedVendors },
        whatsappNotificationsSent: waResult.matchedVendors,
        message:
          waResult.matchedVendors > 0
            ? `Requirement posted! Automatically notified ${waResult.matchedVendors} verified matching vendor(s) on WhatsApp.`
            : "Requirement posted to the Real-Time Business Portal!",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to submit requirement." }, { status: 500 });
  }
}

